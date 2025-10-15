# API Endpoint Implementation Plan: GET /api/users/me

## 1. Endpoint Overview

This endpoint retrieves the authenticated user's profile information, including AI usage statistics. It provides the user with visibility into their current AI generation usage, monthly limits, and remaining available generations. The endpoint is read-only and requires authentication.

**Purpose:**
- Allow users to view their profile information
- Display AI usage statistics and remaining quota
- Support UI components showing usage limits

**Key Characteristics:**
- Read operation (GET)
- Requires authentication
- No input parameters needed
- Returns comprehensive user profile with calculated metrics

## 2. Request Details

### HTTP Method
`GET`

### URL Structure
```
/api/users/me
```

### Authentication
- **Required:** Yes
- **Type:** JWT Bearer token
- **Header:** `Authorization: Bearer <token>`
- **Source:** User session from Supabase Auth via middleware

### Parameters

#### Path Parameters
None

#### Query Parameters
None

#### Request Headers
- `Authorization` (required): JWT Bearer token

#### Request Body
None

## 3. Utilized Types

### Response DTOs (from `src/types.ts`)

**UserProfileDTO** - Success response
```typescript
interface UserProfileDTO {
  id: string;
  ai_usage_count: number;
  usage_period_start: string;
  monthly_limit: number;
  remaining_generations: number;
}
```

**ApiErrorDTO** - Error response
```typescript
interface ApiErrorDTO {
  error: {
    code: ApiErrorCode;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
}
```

### Error Codes Used
- `UNAUTHORIZED` - Missing or invalid authentication token
- `INTERNAL_ERROR` - Database or server errors

### Database Types
From `users` table:
- `id`: UUID
- `ai_usage_count`: INTEGER
- `usage_period_start`: TIMESTAMPTZ

## 4. Response Details

### Success Response (200 OK)

**Status Code:** `200 OK`

**Content-Type:** `application/json`

**Body Structure:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "ai_usage_count": 3,
  "usage_period_start": "2025-10-01T00:00:00Z",
  "monthly_limit": 5,
  "remaining_generations": 2
}
```

**Field Descriptions:**
- `id` - User's unique identifier (UUID from auth)
- `ai_usage_count` - Number of AI summaries generated in current period
- `usage_period_start` - ISO 8601 timestamp of when current usage period began
- `monthly_limit` - Maximum allowed AI generations per month (constant: 5)
- `remaining_generations` - Calculated field: `monthly_limit - ai_usage_count`

### Error Responses

#### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**When returned:**
- Missing `Authorization` header
- Invalid or expired JWT token
- Malformed token

#### 500 Internal Server Error
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to retrieve user profile"
  }
}
```

**When returned:**
- Database connection failures
- Unexpected server errors
- User record not found (edge case)

## 5. Data Flow

### Request Flow

1. **Request Reception**
   - Client sends GET request to `/api/users/me`
   - Authorization header contains JWT Bearer token

2. **Middleware Processing** (`src/middleware/index.ts`)
   - Validate JWT token using Supabase Auth
   - Extract user information from token
   - Attach user data to `context.locals.supabase` and `context.locals.user`
   - Reject if authentication fails (401)

3. **Route Handler** (`src/pages/api/users/me.ts`)
   - Extract authenticated user ID from `context.locals`
   - Call user service to fetch profile data

4. **Service Layer** (`src/lib/services/user.service.ts`)
   - Query `users` table for user profile
   - Retrieve: `id`, `ai_usage_count`, `usage_period_start`
   - Calculate `remaining_generations` = `MONTHLY_LIMIT - ai_usage_count`
   - Map database result to `UserProfileDTO`

5. **Response Construction**
   - Return 200 with UserProfileDTO on success
   - Return appropriate error response on failure

### Database Interaction

**Query:**
```sql
SELECT 
  id,
  ai_usage_count,
  usage_period_start
FROM users
WHERE id = $1;
```

**Parameters:**
- `$1`: User ID from authenticated session

**Expected Result:** Single row or null

### Data Transformation

**Database Row → UserProfileDTO:**
```typescript
{
  id: row.id,
  ai_usage_count: row.ai_usage_count,
  usage_period_start: row.usage_period_start.toISOString(),
  monthly_limit: MONTHLY_AI_LIMIT, // Constant: 5
  remaining_generations: MONTHLY_AI_LIMIT - row.ai_usage_count
}
```

## 6. Security Considerations

### Authentication & Authorization
- **Authentication:** Enforced via Supabase Auth JWT validation in middleware
- **Authorization:** User can only access their own profile (user ID from token)
- **Token Validation:** 
  - Verify signature
  - Check expiration
  - Validate issuer

### Data Protection
- **Sensitive Data:** No passwords or tokens exposed
- **User Isolation:** Query filtered by authenticated user ID only
- **RLS (Row Level Security):** While disabled per migration, application-level security enforced

### Input Sanitization
- **No User Input:** Endpoint accepts no parameters
- **User ID Source:** Extracted from validated JWT token only
- **SQL Injection:** Prevented by parameterized queries

### Security Headers
Ensure the following headers are set (in middleware or Astro config):
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### Rate Limiting
- Consider implementing rate limiting to prevent abuse
- Suggested limit: 100 requests per minute per user
- Can be implemented in middleware or API gateway

### CORS Configuration
- Configure allowed origins in Astro config
- Ensure credentials are properly handled
- Validate Origin header for sensitive operations

## 7. Error Handling

### Error Categories

#### 1. Authentication Errors (401)

**Scenario: Missing Authorization Header**
```typescript
if (!context.locals.user) {
  return new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required"
      }
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

**Scenario: Invalid/Expired Token**
- Handled by middleware
- Returns 401 before reaching route handler

#### 2. Database Errors (500)

**Scenario: Query Failure**
```typescript
try {
  const profile = await userService.getUserProfile(supabase, userId);
  // ...
} catch (error) {
  console.error("Failed to fetch user profile:", error);
  return new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to retrieve user profile"
      }
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

**Scenario: User Not Found**
```typescript
if (!profile) {
  // Log as this should not happen with valid auth
  console.error(`User profile not found for authenticated user: ${userId}`);
  return new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_ERROR",
        message: "User profile not found"
      }
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

#### 3. Unexpected Errors (500)

**Scenario: Unhandled Exceptions**
```typescript
try {
  // ... main logic
} catch (error) {
  console.error("Unexpected error in GET /api/users/me:", error);
  return new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred"
      }
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

### Error Logging Strategy

**Log Levels:**
- **Error:** Database failures, unexpected exceptions
- **Warn:** User not found (edge case)
- **Info:** Successful requests (optional, for monitoring)

**Log Format:**
```typescript
console.error({
  endpoint: "GET /api/users/me",
  userId: userId,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});
```

## 8. Performance Considerations

### Database Performance

**Query Optimization:**
- Single row lookup by primary key (id) - O(1) with index
- No joins required
- Minimal data retrieval (3 columns)

**Expected Performance:**
- Query time: < 5ms (indexed lookup)
- Total response time: < 50ms

**Indexes Used:**
- Primary key index on `users.id` (automatic)

### Caching Strategy

**Response Caching:**
- **Cache Key:** `user:profile:{userId}`
- **TTL:** 5 minutes (usage data changes infrequently)
- **Invalidation:** On AI summary creation or user update

**Implementation (optional):**
```typescript
// Check cache first
const cached = await cache.get(`user:profile:${userId}`);
if (cached) {
  return new Response(cached, { 
    status: 200, 
    headers: { "Content-Type": "application/json" } 
  });
}

// Fetch and cache
const profile = await userService.getUserProfile(supabase, userId);
await cache.set(`user:profile:${userId}`, JSON.stringify(profile), { ttl: 300 });
```

### Network Performance

**Response Size:**
- Typical payload: ~200 bytes (minified JSON)
- Gzip compression: ~150 bytes

**Optimization:**
- Enable gzip/brotli compression
- Set appropriate Cache-Control headers
- Consider HTTP/2 for multiplexing

### Monitoring Metrics

**Key Metrics to Track:**
- Request count per minute
- Average response time
- Error rate (by status code)
- Database query duration
- Cache hit/miss ratio

## 9. Implementation Steps

### Step 1: Create User Service

**File:** `src/lib/services/user.service.ts`

**Implementation:**
```typescript
import type { SupabaseClient } from "../db/supabase.client";
import type { UserProfileDTO } from "../../types";

const MONTHLY_AI_LIMIT = 5;

export class UserService {
  async getUserProfile(
    supabase: SupabaseClient,
    userId: string
  ): Promise<UserProfileDTO | null> {
    const { data, error } = await supabase
      .from("users")
      .select("id, ai_usage_count, usage_period_start")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      ai_usage_count: data.ai_usage_count,
      usage_period_start: data.usage_period_start,
      monthly_limit: MONTHLY_AI_LIMIT,
      remaining_generations: MONTHLY_AI_LIMIT - data.ai_usage_count,
    };
  }
}

export const userService = new UserService();
```

### Step 2: Create API Route Handler

**File:** `src/pages/api/users/me.ts`

**Implementation:**
```typescript
import type { APIRoute } from "astro";
import { userService } from "../../../lib/services/user.service";
import type { UserProfileDTO, ApiErrorDTO } from "../../../types";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  // Check authentication
  if (!context.locals.user) {
    const errorResponse: ApiErrorDTO = {
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = context.locals.user.id;
  const supabase = context.locals.supabase;

  try {
    const profile = await userService.getUserProfile(supabase, userId);

    if (!profile) {
      console.error(`User profile not found for authenticated user: ${userId}`);
      const errorResponse: ApiErrorDTO = {
        error: {
          code: "INTERNAL_ERROR",
          message: "User profile not found",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to retrieve user profile:", error);
    const errorResponse: ApiErrorDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to retrieve user profile",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Step 3: Update Middleware (if needed)

**File:** `src/middleware/index.ts`

Ensure middleware:
- Validates Supabase Auth JWT tokens
- Attaches `context.locals.user` with user data
- Attaches `context.locals.supabase` with authenticated client
- Returns 401 for invalid/missing authentication

**Key middleware logic:**
```typescript
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  // For protected routes, return 401
  if (url.pathname.startsWith('/api/users/')) {
    return new Response(JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required"
      }
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
}

context.locals.user = user;
context.locals.supabase = supabase;
```

### Step 4: Add Constants Configuration (optional)

**File:** `src/lib/constants.ts`

```typescript
export const MONTHLY_AI_LIMIT = 5;
```

Update service to import from constants.


### Step 5: Documentation

**Update API Documentation:**
- Add endpoint to API reference
- Document request/response formats
- Include example cURL commands
- Add error codes and scenarios

**Example cURL:**
```bash
curl -X GET https://api.example.com/api/users/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### Step 6: Monitoring & Logging

**Setup Monitoring:**
- Add endpoint to monitoring dashboard
- Track response times and error rates
- Set up alerts for high error rates (> 5%)

**Logging:**
- Log all 500 errors with stack traces
- Log authentication failures (for security monitoring)
- Consider structured logging for better analysis