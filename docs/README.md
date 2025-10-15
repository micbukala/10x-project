# API Documentation

Welcome to the 10x-project API documentation. This guide provides comprehensive information about our REST API endpoints, their usage, and implementation details.

## Authentication

All API endpoints require authentication via JWT Bearer token from Supabase Auth. Include the token in the `Authorization` header of your requests:

```http
Authorization: Bearer <your-jwt-token>
```

## Base URL

The base URL for all API endpoints is:

```
https://api.example.com
```

Replace `api.example.com` with your actual API domain.

## Endpoints

### User Management

- [User Profile](./api/user-profile.md)

### Summaries

- [Create Manual Summary](./api/summaries/create-manual-summary.md) - Create a new manual summary
- [Generate AI Summary](./api/summaries/generate-ai.md) - Generate an AI-powered summary
- [Delete Summary](./api/summaries/delete-summary.md) - Delete a specific summary (requires ownership)
- [Usage Examples](./api/summaries/usage-example.md) - Common usage patterns
- [Summaries API Overview](./api/summaries/README.md) - Complete summaries API reference

## Common Response Formats

### Success Response

All successful responses follow this format:

- HTTP Status Code: 2XX
- Content-Type: application/json

### Error Response

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "field": "Optional field name for validation errors",
    "details": {
      "Optional": "Additional error details"
    }
  }
}
```

## Error Codes

| Code                   | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `UNAUTHORIZED`         | Missing or invalid authentication token        |
| `FORBIDDEN`            | Insufficient permissions to perform the action |
| `NOT_FOUND`            | Requested resource was not found               |
| `VALIDATION_ERROR`     | Invalid input parameters                       |
| `AI_LIMIT_EXCEEDED`    | Monthly AI generation limit exceeded           |
| `INVALID_CONFIRMATION` | Invalid confirmation input                     |
| `INVALID_PARAMETER`    | Invalid parameter value                        |
| `INTERNAL_ERROR`       | Unexpected server error                        |
| `DATABASE_ERROR`       | Database operation failed                      |

## Rate Limiting

All API endpoints are rate limited to prevent abuse:

- Rate: 100 requests per minute per user
- Headers included in response:
  - `X-RateLimit-Limit`: Maximum requests per minute
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

## Security

- All API endpoints require HTTPS
- Authentication via Supabase Auth JWT tokens
- Input validation using Zod schemas
- SQL injection prevention through parameterized queries
- Security headers set on all responses:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## Performance

- Response time target: < 50ms for most endpoints
- Gzip compression enabled
- HTTP/2 support
- Content caching where appropriate

## Monitoring

API performance and reliability are monitored through:

- Request count per minute
- Average response time
- Error rates (by status code)
- Database query duration
- Cache hit/miss ratio

For internal monitoring metrics, see the `/api/metrics` endpoint (restricted access).
