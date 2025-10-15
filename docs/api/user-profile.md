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

---

## GET /api/users/ai-usage

Retrieves detailed AI usage statistics for the authenticated user including monthly limits, current usage, and billing period information. Automatically resets the usage counter when a new month begins.

### Request

#### HTTP Method

`GET`

#### URL

```
/api/users/ai-usage
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
  "can_generate": true,
  "usage_count": 3,
  "monthly_limit": 5,
  "remaining_generations": 2,
  "period_start": "2025-10-01T00:00:00.000Z",
  "period_end": "2025-10-31T23:59:59.999Z"
}
```

##### Fields Description

| Field                   | Type              | Description                                                      |
| ----------------------- | ----------------- | ---------------------------------------------------------------- |
| `can_generate`          | boolean           | Whether user can generate more AI summaries (remaining > 0)      |
| `usage_count`           | number            | Number of AI summaries generated in current billing period       |
| `monthly_limit`         | number            | Maximum allowed AI generations per month (constant: 5)           |
| `remaining_generations` | number            | Remaining AI generations available (monthly_limit - usage_count) |
| `period_start`          | string (ISO 8601) | Start of current billing period (beginning of month)             |
| `period_end`            | string (ISO 8601) | End of current billing period (end of month, 23:59:59.999)       |

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
    "message": "Failed to retrieve AI usage information"
  }
}
```

**Scenarios:**

- Database connection failures
- Database query errors
- Failed to reset usage counter
- Unexpected server errors

### Business Logic

#### Automatic Period Reset

The endpoint automatically resets the usage counter when a new month starts:

1. Compares `usage_period_start` from database with current month start
2. If `usage_period_start` is before current month → resets `ai_usage_count` to 0
3. Updates `usage_period_start` to current month start
4. Returns updated values in response

#### Usage Calculations

- `remaining_generations = monthly_limit - usage_count`
- `can_generate = remaining_generations > 0`
- Period dates are calculated as calendar month (1st to last day)
- `period_end` is set to last millisecond of the month (23:59:59.999)

### Example Usage

#### cURL

```bash
curl -X GET https://api.example.com/api/users/ai-usage \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

#### TypeScript/JavaScript (fetch)

```typescript
async function getAiUsage() {
  const response = await fetch("/api/users/ai-usage", {
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

  const data = await response.json();
  return data;
}

// Usage example
const usage = await getAiUsage();
if (usage.can_generate) {
  console.log(`You can generate ${usage.remaining_generations} more AI summaries this month`);
} else {
  console.log("Monthly AI generation limit reached");
}
```

#### React Hook Example

```typescript
import { useEffect, useState } from "react";

interface AiUsage {
  can_generate: boolean;
  usage_count: number;
  monthly_limit: number;
  remaining_generations: number;
  period_start: string;
  period_end: string;
}

function useAiUsage() {
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch("/api/users/ai-usage", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch AI usage");

        const data = await response.json();
        setUsage(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, []);

  return { usage, loading, error };
}
```

### Security Notes

- All requests must include a valid JWT token in the Authorization header
- Token is validated against Supabase Auth via middleware
- Row-Level Security (RLS) ensures users only see their own data
- User ID is always extracted from authenticated session, never from request parameters
- SQL injection prevented through parameterized queries (Supabase SDK)
- No possibility of checking other users' limits (authorization bypass prevented)

### Performance

- Expected response time: < 100ms (includes potential counter reset)
- Response size: ~180 bytes (minified JSON)
- Response is gzip compressed
- Database queries use indexed fields (`id` primary key)
- Automatic counter reset happens max once per month per user
