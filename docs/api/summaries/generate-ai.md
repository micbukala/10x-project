# Generate AI Summary API

Endpoint for creating summaries using AI model assistance. This endpoint allows users to generate and store research article summaries while managing their monthly AI generation quota.

## Endpoint

```http
POST /api/summaries/generate-ai
```

## Authentication

JWT Bearer token required in Authorization header.

## Request

### Headers

| Name          | Required | Description      |
| ------------- | -------- | ---------------- |
| Authorization | Yes      | Bearer \<token\> |
| Content-Type  | Yes      | application/json |

### Body

```typescript
{
  "title": string,          // Title of the summary (min length: 1)
  "content": {
    "research_objective": string,
    "methods": string,
    "results": string,
    "discussion": string,
    "open_questions": string,
    "conclusions": string
  },
  "ai_model_name": string  // Name of the AI model used
}
```

## Responses

### Success (201 Created)

```typescript
{
  "id": string,
  "title": string,
  "content": {
    "research_objective": string,
    "methods": string,
    "results": string,
    "discussion": string,
    "open_questions": string,
    "conclusions": string
  },
  "creation_type": "ai",
  "ai_model_name": string,
  "created_at": string,    // ISO 8601 datetime
  "updated_at": string,    // ISO 8601 datetime
  "remaining_generations": number
}
```

### Error Responses

#### 400 Bad Request (Validation Error)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "code": "invalid_type",
        "message": "Required",
        "path": ["content", "research_objective"]
      }
    ]
  }
}
```

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 403 Forbidden (AI Limit Exceeded)

```json
{
  "error": {
    "code": "AI_LIMIT_EXCEEDED",
    "message": "Monthly AI generation limit exceeded",
    "current_usage": 5,
    "monthly_limit": 5,
    "reset_date": "2025-11-01T00:00:00Z"
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to create AI summary"
  }
}
```

## Usage Limits

- Maximum 5 AI generations per user per month
- Usage period resets on the first day of each month

## Examples

### Request Example

```bash
curl -X POST https://api.example.com/api/summaries/generate-ai \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Effects of Climate Change on Marine Biodiversity",
    "content": {
      "research_objective": "To investigate the impact of rising ocean temperatures...",
      "methods": "Analysis of marine population data from 2000-2025...",
      "results": "Observed 15% decline in species diversity...",
      "discussion": "Results indicate significant impact of temperature changes...",
      "open_questions": "Long-term adaptability of marine ecosystems...",
      "conclusions": "Immediate action required to mitigate climate effects..."
    },
    "ai_model_name": "anthropic/claude-3.5-sonnet"
  }'
```

### Success Response Example

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Effects of Climate Change on Marine Biodiversity",
  "content": {
    "research_objective": "To investigate the impact of rising ocean temperatures...",
    "methods": "Analysis of marine population data from 2000-2025...",
    "results": "Observed 15% decline in species diversity...",
    "discussion": "Results indicate significant impact of temperature changes...",
    "open_questions": "Long-term adaptability of marine ecosystems...",
    "conclusions": "Immediate action required to mitigate climate effects..."
  },
  "creation_type": "ai",
  "ai_model_name": "anthropic/claude-3.5-sonnet",
  "created_at": "2025-10-14T11:00:00Z",
  "updated_at": "2025-10-14T11:00:00Z",
  "remaining_generations": 4
}
```
