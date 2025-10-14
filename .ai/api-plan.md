# REST API Plan - AI SciSum

## 1. Resources

| Resource  | Database Table | Description                                    |
| --------- | -------------- | ---------------------------------------------- |
| Users     | `users`        | User profile and AI usage tracking data        |
| Summaries | `summaries`    | Article summaries (AI-generated or manual)     |
| Auth      | `auth.users`   | Managed by Supabase Auth (no custom endpoints) |

## 2. Endpoints

### 2.1 User Management

#### Get Current User Profile

**Endpoint:** `GET /api/users/me`

**Description:** Retrieve the authenticated user's profile including AI usage statistics.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:** None

**Request Body:** None

**Success Response:**

```json
{
  "id": "uuid",
  "ai_usage_count": 3,
  "usage_period_start": "2025-10-01T00:00:00Z",
  "monthly_limit": 5,
  "remaining_generations": 2
}
```

**Status Codes:**

- `200 OK` - Profile retrieved successfully
- `401 Unauthorized` - Missing or invalid authentication token

**Error Response:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

#### Check AI Usage Limit

**Endpoint:** `GET /api/users/ai-usage`

**Description:** Check if the user has available AI generations remaining for the current month.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:** None

**Request Body:** None

**Success Response:**

```json
{
  "can_generate": true,
  "usage_count": 3,
  "monthly_limit": 5,
  "remaining_generations": 2,
  "period_start": "2025-10-01T00:00:00Z",
  "period_end": "2025-10-31T23:59:59Z"
}
```

**Status Codes:**

- `200 OK` - Usage information retrieved successfully
- `401 Unauthorized` - Missing or invalid authentication token

**Error Response:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

#### Delete User Account

**Endpoint:** `DELETE /api/users/me`

**Description:** Permanently delete the authenticated user's account and all associated data (summaries, usage history). This action is irreversible.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:** None

**Request Body:**

```json
{
  "confirmation": "DELETE"
}
```

**Success Response:**

```json
{
  "message": "Account successfully deleted"
}
```

**Status Codes:**

- `200 OK` - Account deleted successfully
- `400 Bad Request` - Invalid confirmation
- `401 Unauthorized` - Missing or invalid authentication token

**Error Response:**

```json
{
  "error": {
    "code": "INVALID_CONFIRMATION",
    "message": "Please provide correct confirmation to delete account"
  }
}
```

---

### 2.2 Summary Management

#### List Summaries

**Endpoint:** `GET /api/summaries`

**Description:** Retrieve a paginated list of all summaries for the authenticated user.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:**

- `page` (integer, optional, default: 1) - Page number
- `limit` (integer, optional, default: 20, max: 100) - Items per page
- `sort` (string, optional, default: "created_at") - Sort field (created_at, updated_at, title)
- `order` (string, optional, default: "desc") - Sort order (asc, desc)
- `creation_type` (string, optional) - Filter by creation type (ai, manual)

**Request Body:** None

**Success Response:**

```json
{
  "summaries": [
    {
      "id": "uuid",
      "title": "Effects of Climate Change on Marine Biodiversity",
      "creation_type": "ai",
      "ai_model_name": "anthropic/claude-3.5-sonnet",
      "created_at": "2025-10-14T10:30:00Z",
      "updated_at": "2025-10-14T10:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 45,
    "items_per_page": 20
  }
}
```

**Status Codes:**

- `200 OK` - Summaries retrieved successfully
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing or invalid authentication token

**Error Response:**

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid sort field. Allowed values: created_at, updated_at, title",
    "field": "sort"
  }
}
```

---

#### Get Summary Details

**Endpoint:** `GET /api/summaries/:id`

**Description:** Retrieve full details of a specific summary.

**Authentication:** Required (JWT Bearer token)

**Path Parameters:**

- `id` (uuid, required) - Summary ID

**Query Parameters:** None

**Request Body:** None

**Success Response:**

```json
{
  "id": "uuid",
  "title": "Effects of Climate Change on Marine Biodiversity",
  "content": {
    "research_objective": "To investigate the impact of rising ocean temperatures...",
    "methods": "We conducted a 5-year longitudinal study...",
    "results": "Our findings show a 23% decline in species diversity...",
    "discussion": "The results align with previous studies...",
    "open_questions": "How will these trends affect coastal ecosystems?",
    "conclusions": "Immediate action is required to mitigate..."
  },
  "creation_type": "ai",
  "ai_model_name": "anthropic/claude-3.5-sonnet",
  "created_at": "2025-10-14T10:30:00Z",
  "updated_at": "2025-10-14T10:30:00Z"
}
```

**Status Codes:**

- `200 OK` - Summary retrieved successfully
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Summary belongs to another user
- `404 Not Found` - Summary not found

**Error Response:**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Summary not found"
  }
}
```

---

#### Create Manual Summary

**Endpoint:** `POST /api/summaries`

**Description:** Create a new manual summary with empty or pre-filled content structure.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:** None

**Request Body:**

```json
{
  "title": "My Research Notes",
  "content": {
    "research_objective": "",
    "methods": "",
    "results": "",
    "discussion": "",
    "open_questions": "",
    "conclusions": ""
  }
}
```

**Success Response:**

```json
{
  "id": "uuid",
  "title": "My Research Notes",
  "content": {
    "research_objective": "",
    "methods": "",
    "results": "",
    "discussion": "",
    "open_questions": "",
    "conclusions": ""
  },
  "creation_type": "manual",
  "ai_model_name": null,
  "created_at": "2025-10-14T11:00:00Z",
  "updated_at": "2025-10-14T11:00:00Z"
}
```

**Status Codes:**

- `201 Created` - Summary created successfully
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Missing or invalid authentication token

**Error Response:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title cannot be empty",
    "field": "title"
  }
}
```

---

#### Generate AI Summary

**Endpoint:** `POST /api/summaries/generate-ai`

**Description:** Create a new AI-generated summary. This endpoint atomically saves the summary and decrements the user's AI usage counter.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:** None

**Request Body:**

```json
{
  "title": "Effects of Climate Change on Marine Biodiversity",
  "content": {
    "research_objective": "To investigate the impact of rising ocean temperatures...",
    "methods": "We conducted a 5-year longitudinal study...",
    "results": "Our findings show a 23% decline in species diversity...",
    "discussion": "The results align with previous studies...",
    "open_questions": "How will these trends affect coastal ecosystems?",
    "conclusions": "Immediate action is required to mitigate..."
  },
  "ai_model_name": "anthropic/claude-3.5-sonnet"
}
```

**Success Response:**

```json
{
  "id": "uuid",
  "title": "Effects of Climate Change on Marine Biodiversity",
  "content": {
    "research_objective": "To investigate the impact of rising ocean temperatures...",
    "methods": "We conducted a 5-year longitudinal study...",
    "results": "Our findings show a 23% decline in species diversity...",
    "discussion": "The results align with previous studies...",
    "open_questions": "How will these trends affect coastal ecosystems?",
    "conclusions": "Immediate action is required to mitigate..."
  },
  "creation_type": "ai",
  "ai_model_name": "anthropic/claude-3.5-sonnet",
  "created_at": "2025-10-14T11:00:00Z",
  "updated_at": "2025-10-14T11:00:00Z",
  "remaining_generations": 4
}
```

**Status Codes:**

- `201 Created` - AI summary created successfully
- `400 Bad Request` - Invalid request body or validation error
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Monthly AI generation limit exceeded
- `500 Internal Server Error` - Failed to create summary

**Error Responses:**

Limit exceeded:

```json
{
  "error": {
    "code": "AI_LIMIT_EXCEEDED",
    "message": "Monthly AI generation limit reached (5/5). Limit will reset on 2025-11-01.",
    "current_usage": 5,
    "monthly_limit": 5,
    "reset_date": "2025-11-01T00:00:00Z"
  }
}
```

Validation error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid content structure. Missing required field: research_objective",
    "field": "content.research_objective"
  }
}
```

---

#### Update Summary

**Endpoint:** `PATCH /api/summaries/:id`

**Description:** Update one or more fields of an existing summary. Only provided fields will be updated.

**Authentication:** Required (JWT Bearer token)

**Path Parameters:**

- `id` (uuid, required) - Summary ID

**Query Parameters:** None

**Request Body:**

```json
{
  "title": "Updated Title",
  "content": {
    "research_objective": "Updated objective text...",
    "conclusions": "Updated conclusions..."
  }
}
```

**Note:** Partial updates to `content` are supported. Only specified content fields will be updated, others remain unchanged.

**Success Response:**

```json
{
  "id": "uuid",
  "title": "Updated Title",
  "content": {
    "research_objective": "Updated objective text...",
    "methods": "Original methods text...",
    "results": "Original results text...",
    "discussion": "Original discussion text...",
    "open_questions": "Original questions...",
    "conclusions": "Updated conclusions..."
  },
  "creation_type": "ai",
  "ai_model_name": "anthropic/claude-3.5-sonnet",
  "created_at": "2025-10-14T10:30:00Z",
  "updated_at": "2025-10-14T12:15:00Z"
}
```

**Status Codes:**

- `200 OK` - Summary updated successfully
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Summary belongs to another user
- `404 Not Found` - Summary not found

**Error Response:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title cannot be empty",
    "field": "title"
  }
}
```

---

#### Delete Summary

**Endpoint:** `DELETE /api/summaries/:id`

**Description:** Permanently delete a summary. This action is irreversible.

**Authentication:** Required (JWT Bearer token)

**Path Parameters:**

- `id` (uuid, required) - Summary ID

**Query Parameters:** None

**Request Body:** None

**Success Response:**

```json
{
  "message": "Summary deleted successfully",
  "deleted_id": "uuid"
}
```

**Status Codes:**

- `200 OK` - Summary deleted successfully
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Summary belongs to another user
- `404 Not Found` - Summary not found

**Error Response:**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Summary not found"
  }
}
```

---

## 3. Authentication and Authorization

### Authentication Mechanism

**Type:** JWT Bearer Token (Supabase Auth)

**Implementation:**

- All API endpoints require authentication via Supabase Auth JWT token
- Token must be included in the `Authorization` header: `Authorization: Bearer <token>`
- Authentication is handled by Astro middleware that validates the JWT with Supabase
- User context is extracted from the token and available via `context.locals.supabase`

**Token Lifecycle:**

- Access tokens expire after 1 hour (Supabase default)
- Refresh tokens are used to obtain new access tokens
- Token refresh is handled client-side by Supabase SDK

**User Management:**

- Registration: Handled by Supabase Auth (`supabase.auth.signUp()`)
- Login: Handled by Supabase Auth (`supabase.auth.signInWithPassword()`)
- Password Reset: Handled by Supabase Auth (`supabase.auth.resetPasswordForEmail()`)
- Logout: Handled by Supabase Auth (`supabase.auth.signOut()`)

### Authorization Mechanism

**Type:** Row-Level Security (RLS) + Middleware Validation

**Implementation:**

1. **Database-Level Authorization (RLS)**
   - Supabase RLS policies enforce data isolation at the database level
   - Users can only access their own data (summaries, profile)
   - RLS policies automatically filter queries based on `auth.uid()`
   - No additional application-level authorization checks needed for basic CRUD operations

2. **Middleware Validation**
   - Astro middleware validates JWT token on every request
   - Extracts user ID from token and creates authenticated Supabase client
   - Rejects requests with missing or invalid tokens (401 Unauthorized)

3. **API-Level Business Logic Authorization**
   - AI generation limit checks before allowing summary creation
   - Validation of request ownership (ensured by RLS)

**Authorization Flow:**

```
Request → Middleware (validate JWT) → Supabase Client (RLS applied) → Database
```

### Security Headers

All API responses include:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 4. Validation and Business Logic

### 4.1 Validation Rules

#### User Resource

| Field              | Rules                                        |
| ------------------ | -------------------------------------------- |
| id                 | Must be valid UUID, must exist in auth.users |
| ai_usage_count     | Integer >= 0                                 |
| usage_period_start | Valid ISO 8601 timestamp                     |

#### Summary Resource

| Field         | Rules                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| id            | Valid UUID (auto-generated)                                                                                             |
| user_id       | Valid UUID, must reference existing user                                                                                |
| title         | Required, non-empty string after trimming, max 500 characters                                                           |
| content       | Required JSONB object with all 6 fields (research_objective, methods, results, discussion, open_questions, conclusions) |
| content.\*    | Each field must be a string, max 50,000 characters per field                                                            |
| creation_type | Required, must be 'ai' or 'manual'                                                                                      |
| ai_model_name | Optional string, max 100 characters, required if creation_type='ai'                                                     |
| created_at    | Auto-generated timestamp                                                                                                |
| updated_at    | Auto-updated timestamp                                                                                                  |

### 4.2 Business Logic Implementation

#### AI Generation Limit (Monthly Reset)

**Logic Location:** Database function `check_ai_limit()` and `create_ai_summary()`

**Flow:**

1. Before initiating AI generation, frontend calls `GET /api/users/ai-usage`
2. Backend calls database function `check_ai_limit()`:
   - Checks if current month differs from `usage_period_start`
   - If new month: Resets `ai_usage_count` to 0 and updates `usage_period_start`
   - Returns boolean: can user generate (count < 5)
3. Frontend proceeds with AI API call if limit available
4. On success, frontend calls `POST /api/summaries/generate-ai`
5. Backend calls database function `create_ai_summary()`:
   - Inserts summary record with `creation_type='ai'`
   - Stores both `content` and `original_ai_content` (for analytics)
   - Atomically increments `ai_usage_count`
   - Returns new summary ID
6. Transaction ensures count only incremented on successful save

**Failure Handling:**

- If AI API fails: No database call, counter unchanged
- If database insert fails: Transaction rolled back, counter unchanged
- User sees clear error message in both cases

#### Manual Summary Creation

**Logic Location:** API endpoint `POST /api/summaries`

**Flow:**

1. Frontend calls `POST /api/summaries` with title and content structure
2. Backend validates request body
3. Backend inserts record with `creation_type='manual'`
4. No impact on `ai_usage_count`
5. `original_ai_content` remains NULL for manual summaries

#### Summary Editing

**Logic Location:** API endpoint `PATCH /api/summaries/:id`

**Flow:**

1. Frontend sends PATCH request with changed fields only
2. Backend validates provided fields
3. Backend performs partial update (merge with existing data)
4. `updated_at` timestamp automatically updated by database trigger
5. `original_ai_content` never modified (preserves analytics data)
6. RLS ensures user can only edit their own summaries

#### Content Modification Tracking (Analytics)

**Logic Location:** Analytics service (future implementation)

**Purpose:** Calculate AI acceptance rate metric (PRD requirement)

**Method:**

- Compare `content` with `original_ai_content` for AI-generated summaries
- Calculate character-level diff
- If modifications < 15% of original length: Summary marked as "accepted"
- Metric: (Accepted AI summaries / Total AI summaries) × 100%

**Note:** No API endpoint needed in MVP, data structure supports future analytics

#### Account Deletion Cascade

**Logic Location:** Database foreign key constraints + API endpoint `DELETE /api/users/me`

**Flow:**

1. Frontend calls `DELETE /api/users/me` with confirmation
2. Backend validates confirmation parameter
3. Backend deletes record from `users` table
4. Database cascading delete automatically removes:
   - All summaries (`summaries.user_id` references `users.id` ON DELETE CASCADE)
5. Backend calls Supabase Admin API to delete auth user
6. Complete data removal ensures GDPR compliance

### 4.3 Error Handling Strategy

#### Error Response Format

All error responses follow consistent structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message",
    "field": "field_name",
    "details": {}
  }
}
```

#### Standard Error Codes

| Code                 | HTTP Status | Description                                        |
| -------------------- | ----------- | -------------------------------------------------- |
| UNAUTHORIZED         | 401         | Missing or invalid authentication token            |
| FORBIDDEN            | 403         | Authenticated but not authorized for this resource |
| NOT_FOUND            | 404         | Resource does not exist                            |
| VALIDATION_ERROR     | 400         | Request validation failed                          |
| AI_LIMIT_EXCEEDED    | 403         | Monthly AI generation limit reached                |
| INVALID_CONFIRMATION | 400         | Account deletion confirmation invalid              |
| INVALID_PARAMETER    | 400         | Invalid query parameter value                      |
| INTERNAL_ERROR       | 500         | Unexpected server error                            |
| DATABASE_ERROR       | 500         | Database operation failed                          |

#### Client-Friendly Messages

- All error messages are in English (as per tech stack requirements)
- Messages explain the problem and suggest resolution when possible
- Internal error details (stack traces, database errors) are logged server-side but not exposed to client
- Validation errors include the specific field that failed validation

### 4.4 Rate Limiting

**Strategy:** User-based monthly limit (business logic) + IP-based rate limiting (infrastructure)

**Monthly AI Generation Limit:**

- Enforced via database logic
- 5 generations per user per calendar month
- Automatically resets on first day of new month
- Frontend shows remaining count before user initiates generation

---
