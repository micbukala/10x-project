-- =====================================================================
-- Migration: Initial Schema for AI SciSum MVP
-- Description: Creates the foundational database schema including users
--              table, summaries table, custom types, triggers, functions,
--              and row-level security policies.
-- 
-- Affected Tables: users, summaries
-- Custom Types: summary_creation_type
-- Functions: handle_new_user(), update_updated_at(), check_ai_limit(),
--            create_ai_summary()
-- 
-- Security: Row-Level Security (RLS) enabled on all tables with granular
--           policies for authenticated users
-- 
-- Special Considerations:
--   - Users table has 1:1 relationship with auth.users
--   - Cascading deletes ensure data cleanup on account deletion
--   - AI usage tracking with monthly reset logic
--   - Transactional AI summary creation with usage increment
-- =====================================================================

-- =====================================================================
-- SECTION 1: Custom Types
-- =====================================================================

-- Create enum type to track how a summary was created
-- Used for analytics and determining AI vs manual creation flow
create type summary_creation_type as enum ('ai', 'manual');

-- =====================================================================
-- SECTION 2: Tables
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: users
-- Purpose: Store user-specific application data with 1:1 relationship
--          to auth.users. Tracks AI usage limits and period tracking.
-- ---------------------------------------------------------------------
create table users (
  -- Primary key referencing supabase auth.users
  -- Cascading delete ensures cleanup when user account is removed
  id uuid primary key references auth.users(id) on delete cascade,
  
  -- Track current month's AI generation usage
  -- Must be non-negative, defaults to 0 for new users
  ai_usage_count integer not null default 0 
    check (ai_usage_count >= 0),
  
  -- Timestamp marking the start of current usage period
  -- Used to determine when to reset the monthly counter
  usage_period_start timestamptz not null default now()
);

-- Enable row-level security for users table
-- This ensures users can only access their own profile data
alter table users enable row level security;

-- ---------------------------------------------------------------------
-- Table: summaries
-- Purpose: Store article summaries created by users via AI generation
--          or manual input. Contains structured content in JSONB format.
-- ---------------------------------------------------------------------
create table summaries (
  -- Primary key with auto-generated UUID
  id uuid primary key default gen_random_uuid(),
  
  -- Foreign key to users table
  -- Cascading delete removes all summaries when user is deleted
  user_id uuid not null references users(id) on delete cascade,
  
  -- Summary title - must not be empty after trimming whitespace
  title text not null check (length(trim(title)) > 0),
  
  -- Structured summary content in JSONB format
  -- Expected keys: research_objective, methods, results, discussion,
  -- open_questions, conclusions
  content jsonb,
  
  -- Original AI-generated content for analytics
  -- Null for manually created summaries
  -- Used to calculate acceptance rate metrics
  original_ai_content jsonb,
  
  -- How the summary was created: 'ai' or 'manual'
  -- Used for analytics and adoption metrics
  creation_type summary_creation_type not null,
  
  -- Name of AI model used for generation
  -- Null for manually created summaries
  -- Used for model performance tracking
  ai_model_name text,
  
  -- Timestamp when summary was created
  created_at timestamptz not null default now(),
  
  -- Timestamp when summary was last modified
  -- Automatically updated by trigger on row modification
  updated_at timestamptz not null default now()
);

-- Enable row-level security for summaries table
-- This ensures users can only access their own summaries
alter table summaries enable row level security;

-- =====================================================================
-- SECTION 3: Indexes
-- =====================================================================

-- Index on user_id for efficient querying of user's summaries
-- Critical for performance when displaying summary lists
create index idx_summaries_user_id on summaries(user_id);

-- Index on creation_type for analytics queries
-- Supports metrics like AI adoption rate and manual vs AI creation stats
create index idx_summaries_creation_type on summaries(creation_type);

-- =====================================================================
-- SECTION 4: Functions
-- =====================================================================

-- ---------------------------------------------------------------------
-- Function: handle_new_user
-- Purpose: Automatically create a user profile when a new user registers
-- Trigger: Fires after insert on auth.users
-- Security: SECURITY DEFINER allows function to insert into users table
-- ---------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
security definer
language plpgsql
as $$
begin
  -- Create new user profile with initial AI usage values
  -- Sets usage count to 0 and period start to beginning of current month
  insert into users (id, ai_usage_count, usage_period_start)
  values (new.id, 0, date_trunc('month', now()));
  
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Function: update_updated_at
-- Purpose: Automatically update the updated_at timestamp on row modification
-- Trigger: Fires before update on summaries table
-- ---------------------------------------------------------------------
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  -- Set updated_at to current timestamp whenever row is modified
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Function: check_ai_limit
-- Purpose: Check if user has remaining AI generation credits for current month
-- Returns: Boolean indicating if user is under the limit (true) or not (false)
-- Security: SECURITY DEFINER ensures consistent access to users table
-- Notes: Automatically resets counter if new month has started
-- ---------------------------------------------------------------------
create or replace function check_ai_limit()
returns boolean
security definer
language plpgsql
as $$
declare
  v_user_id uuid;
  v_usage_count integer;
  v_period_start timestamptz;
  v_current_period timestamptz;
begin
  -- Get current authenticated user's id
  v_user_id := auth.uid();
  
  -- Retrieve current usage stats for the user
  select ai_usage_count, usage_period_start
  into v_usage_count, v_period_start
  from users
  where id = v_user_id;
  
  -- Calculate start of current month
  v_current_period := date_trunc('month', now());
  
  -- Reset counter if we've entered a new month
  -- This ensures monthly limits are automatically refreshed
  if v_period_start < v_current_period then
    update users
    set ai_usage_count = 0,
        usage_period_start = v_current_period
    where id = v_user_id;
    -- User has full limit available in new month
    return true;
  end if;
  
  -- Check if user is under the monthly limit of 5 generations
  return v_usage_count < 5;
end;
$$;

-- ---------------------------------------------------------------------
-- Function: create_ai_summary
-- Purpose: Atomically create an AI-generated summary and increment usage count
-- Parameters:
--   p_title: The summary title
--   p_content: The structured summary content (JSONB)
--   p_original_ai_content: The original AI output for analytics (JSONB)
--   p_ai_model_name: Name of the AI model used
-- Returns: UUID of the newly created summary
-- Security: SECURITY DEFINER ensures atomic operation across tables
-- Notes: This function ensures usage count is only incremented on successful
--        summary creation, preventing credit loss on failures
-- ---------------------------------------------------------------------
create or replace function create_ai_summary(
  p_title text,
  p_content jsonb,
  p_original_ai_content jsonb,
  p_ai_model_name text
)
returns uuid
security definer
language plpgsql
as $$
declare
  v_user_id uuid;
  v_summary_id uuid;
begin
  -- Get current authenticated user's id
  v_user_id := auth.uid();
  
  -- Insert the new AI-generated summary
  -- creation_type is hardcoded to 'ai' for this function
  insert into summaries (
    user_id,
    title,
    content,
    original_ai_content,
    creation_type,
    ai_model_name
  )
  values (
    v_user_id,
    p_title,
    p_content,
    p_original_ai_content,
    'ai',
    p_ai_model_name
  )
  returning id into v_summary_id;
  
  -- Increment the user's AI usage count
  -- This happens atomically with the insert, ensuring consistency
  update users
  set ai_usage_count = ai_usage_count + 1
  where id = v_user_id;
  
  -- Return the new summary's id for frontend reference
  return v_summary_id;
end;
$$;

-- =====================================================================
-- SECTION 5: Triggers
-- =====================================================================

-- Trigger to automatically create user profile when new user registers
create trigger auto_create_profile
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- Trigger to automatically update updated_at timestamp on summary modifications
create trigger auto_update_summaries_timestamp
  before update on summaries
  for each row
  execute function update_updated_at();

-- =====================================================================
-- SECTION 6: Row-Level Security Policies
-- =====================================================================

-- ---------------------------------------------------------------------
-- RLS Policies for: users table
-- Purpose: Ensure users can only view and update their own profile
-- ---------------------------------------------------------------------

-- Policy: Allow authenticated users to view their own profile
-- Rationale: Users need to read their AI usage stats and profile data
create policy select_own_profile_authenticated on users
  for select
  to authenticated
  using (auth.uid() = id);

-- Policy: Allow authenticated users to update their own profile
-- Rationale: Users may need to update profile settings (future feature)
-- Note: Direct updates should be rare; most updates via functions
create policy update_own_profile_authenticated on users
  for update
  to authenticated
  using (auth.uid() = id);

-- ---------------------------------------------------------------------
-- RLS Policies for: summaries table
-- Purpose: Ensure users can only access and manage their own summaries
-- ---------------------------------------------------------------------

-- Policy: Allow authenticated users to view their own summaries
-- Rationale: Users need to read their summary list and individual summaries
create policy select_own_summaries_authenticated on summaries
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Allow authenticated users to insert summaries for themselves
-- Rationale: Users can create new summaries (manual or via create_ai_summary function)
create policy insert_own_summaries_authenticated on summaries
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own summaries
-- Rationale: Users need to edit summary content and titles
create policy update_own_summaries_authenticated on summaries
  for update
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Allow authenticated users to delete their own summaries
-- Rationale: Users can remove summaries they no longer need
create policy delete_own_summaries_authenticated on summaries
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================
