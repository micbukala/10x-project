# Summaries API Documentation

This directory contains detailed documentation for all endpoints related to research summaries management.

## Available Endpoints

### Summary Management

- **[DELETE /api/summaries/:id](./delete-summary.md)** - Delete a specific summary
  - Permanently removes a research summary
  - Requires authentication and ownership
  - Returns 200 on success, 403 if not owner, 404 if not found

- **GET /api/summaries/:id** - Retrieve a specific summary
  - See main [OpenAPI specification](../openapi.yaml)

- **PATCH /api/summaries/:id** - Update a summary
  - See [update-summary.yaml](../update-summary.yaml)

- **GET /api/summaries** - List all summaries
  - See main documentation

- **POST /api/summaries** - Create a manual summary
  - See [create-manual-summary.md](./create-manual-summary.md)

- **POST /api/summaries/generate-ai** - Generate AI summary
  - See [generate-ai.md](./generate-ai.md)

## Database Verification

- **[Database Verification Queries](./delete-summary-verification.sql)** - SQL queries to verify RLS policies and database integration for DELETE operations

## Quick Reference

### Authentication

All endpoints require JWT Bearer token authentication:

```bash
Authorization: Bearer <your-jwt-token>
```

### Common Response Codes

| Code | Description                    |
| ---- | ------------------------------ |
| 200  | Success                        |
| 400  | Bad Request (validation error) |
| 401  | Unauthorized (auth required)   |
| 403  | Forbidden (permission denied)  |
| 404  | Not Found                      |
| 500  | Internal Server Error          |

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "field": "optional_field_name",
    "details": {}
  }
}
```

## Implementation Details

All summary endpoints follow these patterns:

1. **Authentication**: Verified by Astro middleware
2. **Validation**: Request validation using Zod schemas
3. **Service Layer**: Business logic in `SummaryService`
4. **Error Handling**: Consistent error responses via `ErrorService`
5. **Monitoring**: Request logging via `ApiMonitoring`
6. **Security**: Row Level Security (RLS) at database layer

## Related Documentation

- [Main OpenAPI Specification](../openapi.yaml)
- [User Profile API](../user-profile.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
