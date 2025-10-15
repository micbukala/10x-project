# DELETE /api/summaries/:id - API Documentation

## Overview

Permanently deletes a research summary by its UUID. This operation is **irreversible** and requires authentication. Users can only delete their own summaries - attempting to delete another user's summary will result in a 403 Forbidden error.

## Endpoint Details

- **Method:** `DELETE`
- **URL:** `/api/summaries/:id`
- **Authentication:** Required (JWT Bearer token)
- **Content-Type:** `application/json`

## URL Parameters

| Parameter | Type | Required | Description                          |
| --------- | ---- | -------- | ------------------------------------ |
| `id`      | UUID | Yes      | The unique identifier of the summary |

## Request Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Response Codes

| Status Code | Description                                        |
| ----------- | -------------------------------------------------- |
| `200`       | Summary successfully deleted                       |
| `400`       | Invalid UUID format                                |
| `401`       | Authentication required (missing or invalid token) |
| `403`       | Permission denied (not the owner)                  |
| `404`       | Summary not found                                  |
| `500`       | Internal server error                              |

## Examples

### Success Response (200 OK)

**Request:**

```bash
curl -X DELETE \
  'https://your-domain.com/api/summaries/550e8400-e29b-41d4-a716-446655440000' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

**Response:**

```json
{
  "message": "Summary deleted successfully",
  "deleted_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Error: Invalid UUID Format (400 Bad Request)

**Request:**

```bash
curl -X DELETE \
  'https://your-domain.com/api/summaries/invalid-uuid' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

**Response:**

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid summary ID format",
    "details": {
      "fieldErrors": {
        "id": ["Invalid uuid"]
      }
    }
  }
}
```

---

### Error: Unauthorized (401 Unauthorized)

**Request:**

```bash
curl -X DELETE \
  'https://your-domain.com/api/summaries/550e8400-e29b-41d4-a716-446655440000' \
  -H 'Content-Type: application/json'
```

**Response:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

### Error: Permission Denied (403 Forbidden)

**Request:**

```bash
# Attempting to delete another user's summary
curl -X DELETE \
  'https://your-domain.com/api/summaries/550e8400-e29b-41d4-a716-446655440000' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

**Response:**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Permission denied"
  }
}
```

---

### Error: Summary Not Found (404 Not Found)

**Request:**

```bash
curl -X DELETE \
  'https://your-domain.com/api/summaries/550e8400-e29b-41d4-a716-446655440099' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

**Response:**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Summary not found"
  }
}
```

---

### Error: Internal Server Error (500 Internal Server Error)

**Response:**

```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "A database error occurred"
  }
}
```

## JavaScript/TypeScript Examples

### Using Fetch API

```typescript
async function deleteSummary(summaryId: string, authToken: string): Promise<void> {
  const response = await fetch(`/api/summaries/${summaryId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  const result = await response.json();
  console.log(`Summary deleted: ${result.deleted_id}`);
}

// Usage
try {
  await deleteSummary("550e8400-e29b-41d4-a716-446655440000", "your-jwt-token");
  console.log("Summary successfully deleted");
} catch (error) {
  console.error("Failed to delete summary:", error);
}
```

### Using Axios

```typescript
import axios from "axios";

async function deleteSummary(summaryId: string, authToken: string) {
  try {
    const response = await axios.delete(`/api/summaries/${summaryId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    console.log("Deleted:", response.data.deleted_id);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error:", error.response?.data?.error);
      throw error.response?.data?.error;
    }
    throw error;
  }
}
```

### React Hook Example

```typescript
import { useState } from 'react';

function useDeleteSummary() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteSummary = async (summaryId: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/summaries/${summaryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteSummary, isDeleting, error };
}

// Usage in component
function SummaryItem({ summaryId }: { summaryId: string }) {
  const { deleteSummary, isDeleting, error } = useDeleteSummary();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this summary?')) {
      return;
    }

    try {
      await deleteSummary(summaryId);
      alert('Summary deleted successfully');
      // Refresh list or navigate away
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  return (
    <button onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? 'Deleting...' : 'Delete Summary'}
    </button>
  );
}
```

## Security Considerations

### Authentication

- **JWT Bearer Token Required:** All requests must include a valid JWT token in the Authorization header
- **Token Validation:** The middleware automatically validates token authenticity and expiration
- **Session Verification:** Supabase session is verified before processing the request

### Authorization

- **Ownership Verification:** The service verifies that `summary.user_id === authenticated_user.id`
- **IDOR Prevention:** Direct object reference attacks are prevented through ownership checks
- **Row Level Security:** Supabase RLS provides an additional security layer at the database level

### Data Protection

- **Hard Delete:** This endpoint performs a permanent deletion (not soft delete)
- **No Recovery:** Deleted summaries cannot be recovered - ensure proper user confirmation
- **Cascade Behavior:** If a user account is deleted, all their summaries are automatically removed

## Performance Notes

- **Optimized Queries:** Only fetches `id` and `user_id` fields for ownership verification
- **Index Usage:** Leverages primary key index for fast lookups
- **Minimal Operations:** Single SELECT for verification, single DELETE for removal
- **No Caching:** DELETE responses include `Cache-Control: no-store` headers

## Rate Limiting

Currently, no specific rate limiting is implemented for DELETE operations. Consider implementing rate limiting if abuse is detected:

```typescript
// Example rate limit: 10 deletions per minute per user
```

## Related Endpoints

- `GET /api/summaries/:id` - Retrieve a specific summary
- `PATCH /api/summaries/:id` - Update a summary
- `GET /api/summaries` - List all summaries
- `POST /api/summaries` - Create a manual summary
- `POST /api/summaries/generate-ai` - Generate an AI summary

## Error Handling Best Practices

Always handle errors gracefully in your client application:

```typescript
try {
  await deleteSummary(id, token);
} catch (error) {
  if (error.code === "FORBIDDEN") {
    // Show "You don't have permission" message
  } else if (error.code === "NOT_FOUND") {
    // Show "Summary not found" message
  } else if (error.code === "UNAUTHORIZED") {
    // Redirect to login
  } else {
    // Show generic error message
  }
}
```

## Changelog

### Version 1.0.0 (October 15, 2025)

- Initial implementation of DELETE /api/summaries/:id endpoint
- Added UUID validation with Zod schema
- Implemented ownership verification in SummaryService
- Added comprehensive error handling
- Integrated with ApiMonitoring for request logging
- Added Row Level Security policy for delete operations
