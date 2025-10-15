// =====================================================================
// Frontend Integration Examples for DELETE /api/summaries/:id
// Description: Practical examples showing how to integrate the delete
//              summary endpoint in various frontend scenarios
// 
// NOTE: This file contains examples for documentation purposes only.
//       It is not meant to be compiled or executed directly.
//       Copy relevant examples to your actual project files.
// =====================================================================

/* eslint-disable */
// @ts-nocheck

import type { DeleteSummaryResponseDTO, ApiErrorDTO } from "../../../src/types";

// =====================================================================
// Example 1: Basic Delete with Confirmation Dialog
// =====================================================================

/**
 * Simple delete function with user confirmation
 */
async function deleteSummaryWithConfirmation(summaryId: string, authToken: string): Promise<boolean> {
  // Ask user for confirmation
  const confirmed = window.confirm(
    "Are you sure you want to delete this summary? This action cannot be undone."
  );

  if (!confirmed) {
    return false;
  }

  try {
    const response = await fetch(`/api/summaries/${summaryId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error: ApiErrorDTO = await response.json();
      throw new Error(error.error.message);
    }

    const result: DeleteSummaryResponseDTO = await response.json();
    console.log(`Successfully deleted summary: ${result.deleted_id}`);
    return true;
  } catch (error) {
    console.error("Failed to delete summary:", error);
    alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
}

// =====================================================================
// Example 2: React Component with State Management
// =====================================================================

import { useState } from "react";

interface DeleteButtonProps {
  summaryId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

function DeleteSummaryButton({ summaryId, onSuccess, onError }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this summary?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const token = localStorage.getItem("auth_token"); // or get from context/store
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/summaries/${summaryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error: ApiErrorDTO = await response.json();

        // Handle specific error cases
        if (error.error.code === "FORBIDDEN") {
          throw new Error("You don't have permission to delete this summary");
        } else if (error.error.code === "NOT_FOUND") {
          throw new Error("Summary not found");
        }

        throw new Error(error.error.message);
      }

      const result: DeleteSummaryResponseDTO = await response.json();
      console.log("Deleted:", result.deleted_id);

      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete summary";
      console.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}

// =====================================================================
// Example 3: Custom React Hook for Delete Operation
// =====================================================================

interface UseDeleteSummaryReturn {
  deleteSummary: (summaryId: string) => Promise<void>;
  isDeleting: boolean;
  error: string | null;
  reset: () => void;
}

function useDeleteSummary(authToken: string): UseDeleteSummaryReturn {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteSummary = async (summaryId: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/summaries/${summaryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData: ApiErrorDTO = await response.json();
        throw new Error(errorData.error.message);
      }

      await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  const reset = () => {
    setError(null);
  };

  return { deleteSummary, isDeleting, error, reset };
}

// Usage in component:
function SummaryList() {
  const authToken = "your-auth-token"; // Get from context/store
  const { deleteSummary, isDeleting, error } = useDeleteSummary(authToken);
  const [summaries, setSummaries] = useState([
    /* ... */
  ]);

  const handleDelete = async (id: string) => {
    try {
      await deleteSummary(id);
      // Remove from local state
      setSummaries((prev) => prev.filter((s) => s.id !== id));
      alert("Summary deleted successfully");
    } catch (err) {
      // Error is already set in the hook
      console.error("Delete failed:", error);
    }
  };

  return <div>{/* Render summaries with delete buttons */}</div>;
}

// =====================================================================
// Example 4: With Toast Notifications (using react-hot-toast)
// =====================================================================

import toast from "react-hot-toast";

async function deleteSummaryWithToast(summaryId: string, authToken: string): Promise<void> {
  const loadingToast = toast.loading("Deleting summary...");

  try {
    const response = await fetch(`/api/summaries/${summaryId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error: ApiErrorDTO = await response.json();
      throw new Error(error.error.message);
    }

    const result: DeleteSummaryResponseDTO = await response.json();

    toast.success("Summary deleted successfully", {
      id: loadingToast,
      duration: 3000,
    });
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Failed to delete summary", {
      id: loadingToast,
      duration: 5000,
    });
    throw error;
  }
}

// =====================================================================
// Example 5: Redux/Zustand Store Integration
// =====================================================================

// Zustand store example
import { create } from "zustand";

interface SummaryStore {
  summaries: Array<{ id: string; title: string }>;
  deleteSummary: (id: string, authToken: string) => Promise<void>;
  isDeleting: boolean;
}

const useSummaryStore = create<SummaryStore>((set, get) => ({
  summaries: [],
  isDeleting: false,

  deleteSummary: async (id: string, authToken: string) => {
    set({ isDeleting: true });

    try {
      const response = await fetch(`/api/summaries/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error: ApiErrorDTO = await response.json();
        throw new Error(error.error.message);
      }

      // Remove from store
      set((state) => ({
        summaries: state.summaries.filter((s) => s.id !== id),
        isDeleting: false,
      }));
    } catch (error) {
      set({ isDeleting: false });
      throw error;
    }
  },
}));

// =====================================================================
// Example 6: Batch Delete with Progress
// =====================================================================

async function deleteSummariesBatch(
  summaryIds: string[],
  authToken: string,
  onProgress?: (completed: number, total: number) => void
): Promise<{ succeeded: string[]; failed: Array<{ id: string; error: string }> }> {
  const results = {
    succeeded: [] as string[],
    failed: [] as Array<{ id: string; error: string }>,
  };

  for (let i = 0; i < summaryIds.length; i++) {
    const id = summaryIds[i];

    try {
      const response = await fetch(`/api/summaries/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error: ApiErrorDTO = await response.json();
        results.failed.push({ id, error: error.error.message });
      } else {
        results.succeeded.push(id);
      }
    } catch (error) {
      results.failed.push({
        id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    onProgress?.(i + 1, summaryIds.length);
  }

  return results;
}

// Usage:
async function handleBatchDelete(ids: string[], authToken: string) {
  const results = await deleteSummariesBatch(ids, authToken, (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  });

  console.log(`Succeeded: ${results.succeeded.length}, Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.error("Failed deletions:", results.failed);
  }
}

// =====================================================================
// Example 7: Error Handling with User-Friendly Messages
// =====================================================================

function getDeleteErrorMessage(error: ApiErrorDTO): string {
  switch (error.error.code) {
    case "UNAUTHORIZED":
      return "Please log in to delete summaries";
    case "FORBIDDEN":
      return "You don't have permission to delete this summary";
    case "NOT_FOUND":
      return "This summary no longer exists";
    case "INVALID_PARAMETER":
      return "Invalid summary ID";
    case "DATABASE_ERROR":
      return "A database error occurred. Please try again later";
    default:
      return "An unexpected error occurred. Please try again";
  }
}

async function deleteSummaryWithFriendlyErrors(summaryId: string, authToken: string): Promise<void> {
  try {
    const response = await fetch(`/api/summaries/${summaryId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error: ApiErrorDTO = await response.json();
      const friendlyMessage = getDeleteErrorMessage(error);
      throw new Error(friendlyMessage);
    }

    await response.json();
  } catch (error) {
    // Display user-friendly error message
    alert(error instanceof Error ? error.message : "Failed to delete summary");
    throw error;
  }
}

// =====================================================================
// Example 8: Optimistic UI Update
// =====================================================================

function SummaryListOptimistic() {
  const [summaries, setSummaries] = useState<Array<{ id: string; title: string }>>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const handleOptimisticDelete = async (id: string, authToken: string) => {
    // Immediately hide from UI (optimistic update)
    setDeletedIds((prev) => new Set(prev).add(id));

    try {
      const response = await fetch(`/api/summaries/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setDeletedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });

        const error: ApiErrorDTO = await response.json();
        throw new Error(error.error.message);
      }

      // Permanently remove from state
      setSummaries((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
      alert(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  // Filter out optimistically deleted items
  const visibleSummaries = summaries.filter((s) => !deletedIds.has(s.id));

  return <div>{/* Render visibleSummaries */}</div>;
}

export {
  deleteSummaryWithConfirmation,
  DeleteSummaryButton,
  useDeleteSummary,
  deleteSummaryWithToast,
  deleteSummariesBatch,
  getDeleteErrorMessage,
};
