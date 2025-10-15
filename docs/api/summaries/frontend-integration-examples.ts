/**
 * Frontend Integration Examples for Create Manual Summary API
 *
 * This file demonstrates how to integrate the POST /api/summaries endpoint
 * in various frontend scenarios.
 */

import type { SummaryContentDTO, CreateManualSummaryCommand, SummaryDetailDTO } from "../../../src/types";

// ============================================================================
// React Hook Example
// ============================================================================

import { useState } from "react";

/**
 * Custom hook for creating manual summaries
 */
export function useCreateManualSummary() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSummary = async (data: CreateManualSummaryCommand): Promise<SummaryDetailDTO | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/summaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || "Failed to create summary");
      }

      const summary: SummaryDetailDTO = await response.json();
      return summary;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createSummary, isLoading, error };
}

// Usage in React component:
/*
function CreateSummaryForm() {
  const { createSummary, isLoading, error } = useCreateManualSummary();
  const [title, setTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emptyContent: SummaryContentDTO = {
      research_objective: '',
      methods: '',
      results: '',
      discussion: '',
      open_questions: '',
      conclusions: '',
    };

    const summary = await createSummary({
      title,
      content: emptyContent,
    });

    if (summary) {
      // Navigate to edit page or show success message
      console.log('Created summary:', summary.id);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Summary title"
        maxLength={500}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Summary'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
*/

// ============================================================================
// Service Layer Example
// ============================================================================

/**
 * Summary API service
 */
export class SummaryApiService {
  private baseUrl: string;

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl;
  }

  /**
   * Create an empty manual summary with just a title
   */
  async createEmptySummary(title: string): Promise<SummaryDetailDTO> {
    const emptyContent: SummaryContentDTO = {
      research_objective: "",
      methods: "",
      results: "",
      discussion: "",
      open_questions: "",
      conclusions: "",
    };

    return this.createManualSummary({ title, content: emptyContent });
  }

  /**
   * Create a manual summary with pre-filled content
   */
  async createManualSummary(data: CreateManualSummaryCommand): Promise<SummaryDetailDTO> {
    const response = await fetch(`${this.baseUrl}/summaries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || "Failed to create summary");
    }

    return response.json();
  }

  /**
   * Create a summary with partial content (e.g., from paste)
   */
  async createSummaryFromPaste(
    title: string,
    pastedText: string,
    targetField: keyof SummaryContentDTO = "research_objective"
  ): Promise<SummaryDetailDTO> {
    const content: SummaryContentDTO = {
      research_objective: "",
      methods: "",
      results: "",
      discussion: "",
      open_questions: "",
      conclusions: "",
    };

    // Set the pasted text in the target field
    content[targetField] = pastedText;

    return this.createManualSummary({ title, content });
  }
}

// Usage:
/*
const summaryService = new SummaryApiService();

// Create empty summary
const emptySummary = await summaryService.createEmptySummary('My New Notes');

// Create with pre-filled content
const summaryWithContent = await summaryService.createManualSummary({
  title: 'Climate Study',
  content: {
    research_objective: 'Study temperature effects on ecosystems',
    methods: '',
    results: '',
    discussion: '',
    open_questions: '',
    conclusions: '',
  },
});

// Create from pasted text
const summaryFromPaste = await summaryService.createSummaryFromPaste(
  'Pasted Article Notes',
  'This is the text I pasted...',
  'research_objective'
);
*/

// ============================================================================
// Form Validation Helper
// ============================================================================

/**
 * Validate summary data before submission
 */
export function validateSummaryData(data: CreateManualSummaryCommand): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Validate title
  const trimmedTitle = data.title.trim();
  if (!trimmedTitle) {
    errors.title = "Title is required";
  } else if (trimmedTitle.length > 500) {
    errors.title = "Title cannot exceed 500 characters";
  }

  // Validate content structure
  const requiredFields: (keyof SummaryContentDTO)[] = [
    "research_objective",
    "methods",
    "results",
    "discussion",
    "open_questions",
    "conclusions",
  ];

  for (const field of requiredFields) {
    if (typeof data.content[field] !== "string") {
      errors[`content.${field}`] = `${field} must be a string`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Usage:
/*
const summaryData: CreateManualSummaryCommand = {
  title: 'My Summary',
  content: {
    research_objective: '',
    methods: '',
    results: '',
    discussion: '',
    open_questions: '',
    conclusions: '',
  },
};

const validation = validateSummaryData(summaryData);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
} else {
  // Submit to API
}
*/

// ============================================================================
// Error Handling Example
// ============================================================================

/**
 * Handle API errors with user-friendly messages
 */
export function handleSummaryCreationError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Map technical errors to user-friendly messages
    if (message.includes("authentication")) {
      return "Please sign in to create a summary";
    }
    if (message.includes("title")) {
      return "Please provide a valid title (1-500 characters)";
    }
    if (message.includes("content structure")) {
      return "Invalid summary format. Please try again.";
    }
    if (message.includes("database")) {
      return "Unable to save summary. Please try again later.";
    }

    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

// Usage:
/*
try {
  const summary = await summaryService.createEmptySummary('My Notes');
  // Success
} catch (error) {
  const userMessage = handleSummaryCreationError(error);
  // Show userMessage to the user in a toast/alert
  showErrorToast(userMessage);
}
*/

// ============================================================================
// React Query Integration (Optional)
// ============================================================================

/**
 * React Query mutation for creating summaries
 * Requires @tanstack/react-query
 */
/*
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateSummaryMutation() {
  const queryClient = useQueryClient();
  const summaryService = new SummaryApiService();

  return useMutation({
    mutationFn: (data: CreateManualSummaryCommand) =>
      summaryService.createManualSummary(data),
    onSuccess: (newSummary) => {
      // Invalidate and refetch summaries list
      queryClient.invalidateQueries({ queryKey: ['summaries'] });
      
      // Optionally, add the new summary to the cache immediately
      queryClient.setQueryData(['summaries', newSummary.id], newSummary);
    },
    onError: (error) => {
      const message = handleSummaryCreationError(error);
      // Show error toast
      console.error(message);
    },
  });
}

// Usage in component:
function CreateSummaryButton() {
  const createMutation = useCreateSummaryMutation();

  const handleCreate = () => {
    createMutation.mutate({
      title: 'New Summary',
      content: {
        research_objective: '',
        methods: '',
        results: '',
        discussion: '',
        open_questions: '',
        conclusions: '',
      },
    });
  };

  return (
    <button
      onClick={handleCreate}
      disabled={createMutation.isPending}
    >
      {createMutation.isPending ? 'Creating...' : 'Create Summary'}
    </button>
  );
}
*/
