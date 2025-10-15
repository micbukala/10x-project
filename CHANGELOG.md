# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **DELETE /api/summaries/:id** - New endpoint to permanently delete research summaries
  - UUID validation using Zod schema
  - Ownership verification to prevent unauthorized deletions (403 Forbidden)
  - Row Level Security (RLS) policy at database level
  - Comprehensive error handling (400, 401, 403, 404, 500)
  - ApiMonitoring integration for request logging
  - Cache-Control headers to prevent caching of delete operations
  - Detailed API documentation with cURL and TypeScript examples
  - Database verification SQL queries for RLS testing
  - Custom error classes (NotFoundError, ForbiddenError) in SummaryService
  - Enhanced ErrorService to handle custom error classes

### Changed

- Updated `ErrorService` to support `NotFoundError`, `ForbiddenError`, and `AiLimitExceededError` custom exceptions
- Fixed scope issues for `userId` in GET and PATCH handlers in `/api/summaries/[id].ts`
- Added proper TypeScript type safety for delete operations

### Documentation

- Created comprehensive DELETE endpoint documentation at `docs/api/summaries/delete-summary.md`
- Added database verification queries at `docs/api/summaries/delete-summary-verification.sql`
- Created summaries API index at `docs/api/summaries/README.md`
- Updated main documentation index at `docs/README.md`
- OpenAPI specification already includes DELETE endpoint definition

### Security

- Implemented ownership verification in `SummaryService.deleteSummary()`
- Added RLS policy `delete_own_summaries_authenticated` for database-level protection
- IDOR (Insecure Direct Object Reference) prevention through user_id validation

---

## [1.0.0] - 2025-10-15

### Initial Release

- User authentication and profile management
- Manual summary creation
- AI-powered summary generation with usage limits
- Summary listing with pagination
- Summary retrieval by ID
- Summary updates (PATCH)
- Supabase integration for backend
- Row Level Security policies
- API monitoring and logging

[Unreleased]: https://github.com/micbukala/10x-project/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/micbukala/10x-project/releases/tag/v1.0.0
