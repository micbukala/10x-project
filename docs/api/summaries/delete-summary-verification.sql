-- =====================================================================
-- Database Verification for DELETE /api/summaries/:id Endpoint
-- Description: SQL queries to verify database integration and RLS policies
-- =====================================================================

-- =====================================================================
-- 1. Verify RLS Policies for DELETE Operations
-- =====================================================================

-- Check if RLS is enabled on summaries table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'summaries';
-- Expected: rowsecurity = true

-- List all policies on summaries table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'summaries'
ORDER BY policyname;
-- Expected: delete_own_summaries_authenticated policy exists with cmd = 'DELETE'

-- =====================================================================
-- 2. Verify DELETE Policy Logic
-- =====================================================================

-- Detailed view of DELETE policy
SELECT 
    policyname,
    cmd,
    qual as "using_clause",
    with_check
FROM pg_policies 
WHERE tablename = 'summaries' 
  AND cmd = 'DELETE';
-- Expected: using clause contains "auth.uid() = user_id"

-- =====================================================================
-- 3. Verify Cascade Delete Behavior
-- =====================================================================

-- Check foreign key constraints on summaries table
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'summaries'
    AND tc.constraint_type = 'FOREIGN KEY';
-- Expected: delete_rule = 'CASCADE' for user_id reference

-- =====================================================================
-- 4. Performance Verification
-- =====================================================================

-- Check indexes on summaries table for optimal DELETE performance
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'summaries'
ORDER BY indexname;
-- Expected: Primary key index on id column exists

-- Verify statistics for summaries table
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE tablename = 'summaries'
    AND attname IN ('id', 'user_id');
-- Check index effectiveness

-- =====================================================================
-- 5. Manual Test Scenarios (to be executed with test data)
-- =====================================================================

-- Scenario 1: Verify ownership check prevents deletion of other user's summary
-- This should be tested via API endpoint with different user tokens

-- Scenario 2: Verify successful deletion
-- INSERT INTO summaries (user_id, title, content, creation_type)
-- VALUES (
--     auth.uid(),
--     'Test Summary for Deletion',
--     '{"research_objective": "Test", "methods": "Test", "results": "Test", "discussion": "Test", "open_questions": "Test", "conclusions": "Test"}'::jsonb,
--     'manual'
-- )
-- RETURNING id;
-- Then DELETE via API with same user's token

-- Scenario 3: Verify 404 for non-existent summary
-- Attempt to DELETE non-existent UUID via API

-- =====================================================================
-- 6. RLS Policy Test (requires service role or appropriate permissions)
-- =====================================================================

-- Test delete policy with different user contexts
-- Note: These require executing as different authenticated users

-- Example structure for testing (not executable as-is):
-- SET LOCAL role authenticated;
-- SET LOCAL request.jwt.claim.sub = '<user_id_1>';
-- 
-- DELETE FROM summaries WHERE id = '<summary_id_owned_by_user_1>';
-- -- Should succeed
-- 
-- DELETE FROM summaries WHERE id = '<summary_id_owned_by_user_2>';
-- -- Should fail due to RLS policy

-- =====================================================================
-- 7. Audit and Monitoring Queries
-- =====================================================================

-- Count summaries by creation type
SELECT 
    creation_type,
    COUNT(*) as total_count
FROM summaries
GROUP BY creation_type;

-- Recent deletions tracking (if soft delete is later implemented)
-- Currently not applicable as we use hard delete

-- Check for orphaned records (should be none due to CASCADE)
SELECT COUNT(*) as orphaned_summaries
FROM summaries s
LEFT JOIN users u ON s.user_id = u.id
WHERE u.id IS NULL;
-- Expected: 0

-- =====================================================================
-- END OF VERIFICATION QUERIES
-- =====================================================================
