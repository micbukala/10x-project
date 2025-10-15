# Update Summary API Guide

This guide explains how to use the summary update endpoint in your frontend application.

## Endpoint Details

- **URL:** `/api/summaries/:id`
- **Method:** `PATCH`
- **Auth Required:** Yes (JWT Bearer Token)

## Usage Examples

### Using Fetch API

```typescript
async function updateSummary(summaryId: string, updates: UpdateSummaryCommand) {
  const response = await fetch(`/api/summaries/${summaryId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`, // Your token management function
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return response.json();
}
```

### Example: Update Title Only

```typescript
try {
  const updatedSummary = await updateSummary("123e4567-e89b-12d3-a456-426614174000", {
    title: "Updated Research Summary Title",
  });
  console.log("Summary updated:", updatedSummary);
} catch (error) {
  console.error("Failed to update summary:", error);
}
```

### Example: Update Specific Content Fields

```typescript
try {
  const updatedSummary = await updateSummary("123e4567-e89b-12d3-a456-426614174000", {
    content: {
      research_objective: "Updated research objective",
      methods: "Updated research methods",
    },
  });
  console.log("Summary content updated:", updatedSummary);
} catch (error) {
  console.error("Failed to update summary:", error);
}
```

## Error Handling

The API returns structured error responses that you should handle in your frontend:

```typescript
type ApiError = {
  error: {
    code: "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "DATABASE_ERROR" | "INTERNAL_ERROR";
    message: string;
    field?: string;
  };
};

function handleApiError(error: ApiError) {
  switch (error.error.code) {
    case "VALIDATION_ERROR":
      // Handle validation errors (e.g., show field-specific error messages)
      return `Invalid ${error.error.field}: ${error.error.message}`;

    case "UNAUTHORIZED":
      // Handle authentication errors (e.g., redirect to login)
      return "Please log in to continue";

    case "FORBIDDEN":
      // Handle permission errors
      return "You do not have permission to update this summary";

    case "NOT_FOUND":
      // Handle not found errors
      return "Summary not found";

    default:
      // Handle other errors
      return "An unexpected error occurred. Please try again later.";
  }
}
```

## Tips

1. Always validate data on the frontend before sending to reduce unnecessary requests
2. Implement optimistic updates for better UX, but be prepared to roll back on failure
3. Use proper TypeScript types for better type safety:

```typescript
import type { UpdateSummaryCommand, SummaryDetailDTO } from "../types";

// Your update function with proper typing
async function updateSummary(summaryId: string, updates: UpdateSummaryCommand): Promise<SummaryDetailDTO> {
  // Implementation
}
```
