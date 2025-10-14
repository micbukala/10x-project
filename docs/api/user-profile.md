# User Profile API Documentation

## GET /api/users/me

Retrieves the authenticated user's profile information including AI usage statistics.

### Request

#### HTTP Method

`GET`

#### URL

```
/api/users/me
```

#### Headers

| Name            | Required | Description                                                   |
| --------------- | -------- | ------------------------------------------------------------- |
| `Authorization` | Yes      | JWT Bearer token for authentication. Format: `Bearer <token>` |
| `Content-Type`  | No       | Set to `application/json`                                     |

#### Parameters

None (authentication via JWT token only)

### Response

#### Success Response (200 OK)

##### Content Type

`application/json`

##### Body Structure

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "ai_usage_count": 3,
  "usage_period_start": "2025-10-01T00:00:00Z",
  "monthly_limit": 5,
  "remaining_generations": 2
}
```

##### Fields Description

| Field                   | Type              | Description                                            |
| ----------------------- | ----------------- | ------------------------------------------------------ |
| `id`                    | string (UUID)     | User's unique identifier                               |
| `ai_usage_count`        | number            | Number of AI summaries generated in current period     |
| `usage_period_start`    | string (ISO 8601) | Start timestamp of current usage period                |
| `monthly_limit`         | number            | Maximum allowed AI generations per month (constant: 5) |
| `remaining_generations` | number            | Remaining AI generations for current period            |

#### Error Responses

##### 401 Unauthorized

Returned when authentication fails.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Scenarios:**

- Missing Authorization header
- Invalid JWT token
- Expired JWT token
- Malformed token

##### 500 Internal Server Error

Returned for server-side errors.

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to retrieve user profile"
  }
}
```

**Scenarios:**

- Database connection failures
- Unexpected server errors
- User record not found (edge case)

### Example Usage

#### cURL

```bash
curl -X GET https://api.example.com/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

#### TypeScript/JavaScript (fetch)

```typescript
async function getUserProfile() {
  const response = await fetch("/api/users/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return await response.json();
}
```

### Security Notes

- All requests must include a valid JWT token in the Authorization header
- Token is validated against Supabase Auth
- Each user can only access their own profile
- No sensitive data (passwords, tokens) is exposed
- SQL injection is prevented through parameterized queries

### Rate Limiting

- Limit: 100 requests per minute per user
- Headers included in response:
  - `X-RateLimit-Limit`: Maximum requests per minute
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

### Performance

- Expected response time: < 50ms
- Response size: ~200 bytes (minified JSON)
- Response is gzip compressed
- Cache-Control headers set for 5 minutes TTL
- Uses HTTP/2 for improved performance
