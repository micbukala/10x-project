-- =====================================================================
-- Migration: Fix handle_new_user function to use explicit schema
-- Description: Updates handle_new_user function to explicitly reference
--              public.users to avoid schema search_path issues
-- =====================================================================

-- Drop and recreate the function with explicit schema reference
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Create new user profile with initial AI usage values
  -- Sets usage count to 0 and period start to beginning of current month
  insert into public.users (id, ai_usage_count, usage_period_start)
  values (new.id, 0, date_trunc('month', now()));
  
  return new;
end;
$$;

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================
