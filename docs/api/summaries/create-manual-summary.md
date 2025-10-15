# Create Manual Summary

Create a new manual summary for a scientific article. Users can create summaries with empty or pre-filled content structure.

## Endpoint

```
POST /api/summaries
```

## Authentication

**Required:** Yes

Include a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## Request

### Headers

| Header          | Required | Description                     |
| --------------- | -------- | ------------------------------- |
| `Authorization` | Yes      | Bearer token from Supabase Auth |
| `Content-Type`  | Yes      | Must be `application/json`      |

### Body Parameters

| Parameter | Type   | Required | Description                                   |
| --------- | ------ | -------- | --------------------------------------------- |
| `title`   | string | Yes      | Summary title (1-500 characters after trim)   |
| `content` | object | Yes      | Structured content with all 6 required fields |

### Content Structure

The `content` object must contain all 6 fields as strings (can be empty):

| Field                | Type   | Required | Description                          |
| -------------------- | ------ | -------- | ------------------------------------ |
| `research_objective` | string | Yes      | Research goals and objectives        |
| `methods`            | string | Yes      | Methodology and experimental design  |
| `results`            | string | Yes      | Key findings and data                |
| `discussion`         | string | Yes      | Interpretation and implications      |
| `open_questions`     | string | Yes      | Unresolved questions and future work |
| `conclusions`        | string | Yes      | Main conclusions and takeaways       |

### Example Request - Empty Summary

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

### Example Request - Pre-filled Content

```json
{
  "title": "Climate Change Impact Study",
  "content": {
    "research_objective": "Investigate temperature effects on marine biodiversity",
    "methods": "5-year longitudinal study of coastal ecosystems",
    "results": "",
    "discussion": "",
    "open_questions": "",
    "conclusions": ""
  }
}
```

## Response

### Success Response

**Status Code:** `201 Created`

**Content-Type:** `application/json`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
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
  "created_at": "2025-10-14T11:00:00.000Z",
  "updated_at": "2025-10-14T11:00:00.000Z"
}
```

### Response Fields

| Field           | Type   | Description                         |
| --------------- | ------ | ----------------------------------- |
| `id`            | string | Unique identifier (UUID)            |
| `title`         | string | Summary title                       |
| `content`       | object | Structured summary content          |
| `creation_type` | string | Always `"manual"` for this endpoint |
| `ai_model_name` | null   | Always `null` for manual summaries  |
| `created_at`    | string | ISO 8601 timestamp of creation      |
| `updated_at`    | string | ISO 8601 timestamp of last update   |

## Error Responses

### 401 Unauthorized

Missing or invalid authentication token.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 400 Bad Request - Empty Title

Title is empty after trimming whitespace.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title cannot be empty",
    "field": "title"
  }
}
```

### 400 Bad Request - Title Too Long

Title exceeds 500 characters.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title cannot exceed 500 characters",
    "field": "title"
  }
}
```

### 400 Bad Request - Invalid Content Structure

Missing required fields in content or invalid field types.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid summary content structure. All 6 fields are required: research_objective, methods, results, discussion, open_questions, conclusions",
    "field": "content",
    "details": {
      "_errors": [],
      "fieldErrors": {
        "research_objective": ["Expected string, received undefined"]
      }
    }
  }
}
```

### 400 Bad Request - Invalid JSON

Request body is not valid JSON.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid JSON format",
    "details": {
      "parseError": "Unexpected token < in JSON at position 0"
    }
  }
}
```

### 500 Internal Server Error

Database error or unexpected server error.

```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to create summary"
  }
}
```

## Usage Example

### JavaScript/TypeScript

```typescript
interface SummaryContent {
  research_objective: string;
  methods: string;
  results: string;
  discussion: string;
  open_questions: string;
  conclusions: string;
}

interface CreateSummaryRequest {
  title: string;
  content: SummaryContent;
}

interface SummaryResponse {
  id: string;
  title: string;
  content: SummaryContent;
  creation_type: "manual" | "ai";
  ai_model_name: string | null;
  created_at: string;
  updated_at: string;
}

async function createManualSummary(token: string, data: CreateSummaryRequest): Promise<SummaryResponse> {
  const response = await fetch("/api/summaries", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return response.json();
}

// Usage
const token = "your-jwt-token";
const summaryData = {
  title: "My Research Notes",
  content: {
    research_objective: "",
    methods: "",
    results: "",
    discussion: "",
    open_questions: "",
    conclusions: "",
  },
};

createManualSummary(token, summaryData)
  .then((summary) => console.log("Created:", summary))
  .catch((error) => console.error("Error:", error));
```

### cURL

```bash
curl -X POST https://api.example.com/api/summaries \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Research Notes",
    "content": {
      "research_objective": "",
      "methods": "",
      "results": "",
      "discussion": "",
      "open_questions": "",
      "conclusions": ""
    }
  }'
```

## Notes

- Manual summaries do **not** count towards the AI generation limit
- The `user_id` is automatically extracted from the JWT token
- All fields in `content` are required but can be empty strings
- Title is trimmed before validation, so leading/trailing whitespace is removed
- The summary is automatically associated with the authenticated user
- Row-Level Security (RLS) ensures users can only create their own summaries

## Related Endpoints

- [Generate AI Summary](./generate-ai.md) - Create an AI-generated summary
- [Update Summary](./update-summary.yaml) - Update an existing summary
- [Get Summary](./get-summary.md) - Retrieve a specific summary
- [List Summaries](./list-summaries.md) - Get all user summaries with pagination
