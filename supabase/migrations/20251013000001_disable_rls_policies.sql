-- =====================================================================
-- Migration: Disable RLS Policies
-- Description: Disables all Row-Level Security policies on users and
--              summaries tables while keeping RLS enabled on the tables
-- =====================================================================

-- Drop all RLS policies for users table
drop policy if exists select_own_profile_authenticated on users;
drop policy if exists update_own_profile_authenticated on users;

-- Drop all RLS policies for summaries table
drop policy if exists select_own_summaries_authenticated on summaries;
drop policy if exists insert_own_summaries_authenticated on summaries;
drop policy if exists update_own_summaries_authenticated on summaries;
drop policy if exists delete_own_summaries_authenticated on summaries;

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================
