-- =====================================================================
-- Migration: Enable RLS Policies for Deleting Summaries
-- Description: Adds RLS policy for deleting own summaries
-- =====================================================================

-- Enable RLS on summaries table if not already enabled
alter table summaries force row level security;

-- Create policy for deleting own summaries
create policy delete_own_summaries_authenticated
    on summaries
    for delete
    using (
        auth.uid() = user_id
    );

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================