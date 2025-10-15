-- =====================================================================
-- Database Verification Guide: Create Manual Summary Endpoint
-- =====================================================================
-- This file contains SQL queries to verify that the POST /api/summaries
-- endpoint is working correctly at the database level.
--
-- These queries can be run in Supabase SQL Editor or any PostgreSQL client
-- to verify data integrity, RLS policies, and proper data storage.
-- =====================================================================

-- =====================================================================
-- SECTION 1: Verify Recent Manual Summaries
-- =====================================================================

-- Query 1.1: View most recent manual summaries
-- Expected results:
--   - creation_type should be 'manual'
--   - ai_model_name should be NULL
--   - created_at should equal updated_at (for newly created records)
--   - user_id should match authenticated user

SELECT 
  id,
  user_id,
  title,
  creation_type,
  ai_model_name,
  created_at,
  updated_at,
  created_at = updated_at as is_newly_created
FROM summaries
WHERE creation_type = 'manual'
ORDER BY created_at DESC
LIMIT 10;

-- Query 1.2: Count manual vs AI summaries by user
-- Useful for verifying data distribution

SELECT 
  user_id,
  creation_type,
  COUNT(*) as summary_count
FROM summaries
GROUP BY user_id, creation_type
ORDER BY user_id, creation_type;

-- =====================================================================
-- SECTION 2: Verify JSONB Content Structure
-- =====================================================================

-- Query 2.1: Inspect content structure of a specific summary
-- Replace '<summary-id>' with actual UUID
-- Expected results:
--   - content_type should be 'object'
--   - All 6 required fields should be present
--   - Each field should be a string (can be empty)

SELECT 
  id,
  title,
  jsonb_typeof(content) as content_type,
  content ? 'research_objective' as has_research_objective,
  content ? 'methods' as has_methods,
  content ? 'results' as has_results,
  content ? 'discussion' as has_discussion,
  content ? 'open_questions' as has_open_questions,
  content ? 'conclusions' as has_conclusions,
  jsonb_typeof(content->'research_objective') as research_objective_type
FROM summaries
WHERE id = '<summary-id>';

-- Query 2.2: Extract all content fields from a summary
-- Useful for verifying actual content values

SELECT 
  id,
  title,
  content->>'research_objective' as research_objective,
  content->>'methods' as methods,
  content->>'results' as results,
  content->>'discussion' as discussion,
  content->>'open_questions' as open_questions,
  content->>'conclusions' as conclusions
FROM summaries
WHERE id = '<summary-id>';

-- Query 2.3: Find summaries with empty vs filled content
-- Useful for analytics

SELECT 
  id,
  title,
  creation_type,
  CASE 
    WHEN content->>'research_objective' = '' 
      AND content->>'methods' = ''
      AND content->>'results' = ''
      AND content->>'discussion' = ''
      AND content->>'open_questions' = ''
      AND content->>'conclusions' = ''
    THEN 'empty'
    ELSE 'has_content'
  END as content_status
FROM summaries
WHERE creation_type = 'manual'
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================================
-- SECTION 3: Verify Row-Level Security (RLS) Policies
-- =====================================================================

-- Query 3.1: View RLS policies for summaries table
-- Expected results:
--   - Policy 'insert_own_summaries_authenticated' should exist
--   - with_check should verify auth.uid() = user_id

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
  AND cmd = 'INSERT';

-- Query 3.2: Test RLS policy enforcement (should fail if not owner)
-- This query attempts to insert a summary for another user
-- It should FAIL due to RLS policy violation

-- IMPORTANT: Do not run this in production without understanding the implications
-- This is for testing purposes only

/*
INSERT INTO summaries (user_id, title, content, creation_type, ai_model_name)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Non-existent user
  'Test RLS Policy',
  '{"research_objective": "", "methods": "", "results": "", "discussion": "", "open_questions": "", "conclusions": ""}'::jsonb,
  'manual',
  NULL
);
-- Expected result: ERROR: new row violates row-level security policy for table "summaries"
*/

-- =====================================================================
-- SECTION 4: Verify Data Integrity Constraints
-- =====================================================================

-- Query 4.1: Check for summaries with invalid title (should be empty)
-- All manual summaries should have non-empty trimmed titles

SELECT 
  id,
  title,
  LENGTH(title) as title_length,
  LENGTH(TRIM(title)) as trimmed_length
FROM summaries
WHERE creation_type = 'manual'
  AND LENGTH(TRIM(title)) = 0;

-- Query 4.2: Check for summaries with invalid content structure
-- All summaries should have JSONB content with 6 required fields

SELECT 
  id,
  title,
  content ? 'research_objective' as has_ro,
  content ? 'methods' as has_methods,
  content ? 'results' as has_results,
  content ? 'discussion' as has_discussion,
  content ? 'open_questions' as has_oq,
  content ? 'conclusions' as has_conclusions
FROM summaries
WHERE creation_type = 'manual'
  AND (
    NOT (content ? 'research_objective')
    OR NOT (content ? 'methods')
    OR NOT (content ? 'results')
    OR NOT (content ? 'discussion')
    OR NOT (content ? 'open_questions')
    OR NOT (content ? 'conclusions')
  );

-- Query 4.3: Verify manual summaries have NULL ai_model_name
-- All manual summaries should have NULL in ai_model_name

SELECT 
  id,
  title,
  creation_type,
  ai_model_name
FROM summaries
WHERE creation_type = 'manual'
  AND ai_model_name IS NOT NULL;

-- Query 4.4: Verify manual summaries have NULL original_ai_content
-- All manual summaries should have NULL in original_ai_content

SELECT 
  id,
  title,
  creation_type,
  original_ai_content
FROM summaries
WHERE creation_type = 'manual'
  AND original_ai_content IS NOT NULL;

-- =====================================================================
-- SECTION 5: Performance and Indexing Verification
-- =====================================================================

-- Query 5.1: Verify indexes exist for summaries table
-- Expected results:
--   - idx_summaries_user_id for efficient user-based queries
--   - idx_summaries_creation_type for analytics

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'summaries'
ORDER BY indexname;

-- Query 5.2: Explain query plan for common query
-- Verify that user_id index is being used

EXPLAIN ANALYZE
SELECT *
FROM summaries
WHERE user_id = auth.uid()
  AND creation_type = 'manual'
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================================
-- SECTION 6: Monitoring and Analytics Queries
-- =====================================================================

-- Query 6.1: Summary creation statistics (last 7 days)
-- Useful for monitoring endpoint usage

SELECT 
  DATE(created_at) as date,
  creation_type,
  COUNT(*) as count
FROM summaries
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), creation_type
ORDER BY date DESC, creation_type;

-- Query 6.2: Average content length by creation type
-- Useful for understanding user behavior

SELECT 
  creation_type,
  AVG(
    LENGTH(content->>'research_objective') +
    LENGTH(content->>'methods') +
    LENGTH(content->>'results') +
    LENGTH(content->>'discussion') +
    LENGTH(content->>'open_questions') +
    LENGTH(content->>'conclusions')
  )::integer as avg_total_content_length,
  COUNT(*) as summary_count
FROM summaries
GROUP BY creation_type;

-- Query 6.3: Most active users (by manual summary creation)
-- Useful for identifying power users

SELECT 
  user_id,
  COUNT(*) as manual_summary_count,
  MAX(created_at) as last_created
FROM summaries
WHERE creation_type = 'manual'
GROUP BY user_id
ORDER BY manual_summary_count DESC
LIMIT 10;

-- =====================================================================
-- SECTION 7: Data Cleanup Queries (Use with Caution)
-- =====================================================================

-- Query 7.1: Delete test summaries (if needed)
-- CAUTION: Only use this in development/staging environments

/*
DELETE FROM summaries
WHERE title LIKE 'Test%'
  OR title LIKE '%test%'
  AND created_at >= NOW() - INTERVAL '1 day';
*/

-- Query 7.2: Delete all manual summaries for a specific user
-- CAUTION: This is destructive and cannot be undone

/*
DELETE FROM summaries
WHERE user_id = '<user-id>'
  AND creation_type = 'manual';
*/

-- =====================================================================
-- SECTION 8: Example Test Data Insertion
-- =====================================================================

-- Query 8.1: Insert a test manual summary (as authenticated user)
-- This simulates what the API endpoint does

/*
INSERT INTO summaries (
  user_id,
  title,
  content,
  creation_type,
  ai_model_name
)
VALUES (
  auth.uid(), -- Current authenticated user
  'Test Manual Summary',
  '{
    "research_objective": "Test objective",
    "methods": "",
    "results": "",
    "discussion": "",
    "open_questions": "",
    "conclusions": ""
  }'::jsonb,
  'manual',
  NULL
)
RETURNING *;
*/

-- =====================================================================
-- END OF VERIFICATION GUIDE
-- =====================================================================
