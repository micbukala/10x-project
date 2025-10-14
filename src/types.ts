// src/types.ts
import type { Enums } from "./db/database.types";

// ============================================================================
// Summary Content Structure
// ============================================================================

/**
 * Structure of the summary content JSONB field.
 * All fields are required strings representing different sections of a research summary.
 */
export interface SummaryContentDTO {
  research_objective: string;
  methods: string;
  results: string;
  discussion: string;
  open_questions: string;
  conclusions: string;
}

// ============================================================================
// User DTOs
// ============================================================================

/**
 * User profile response including AI usage statistics.
 * Returned by: GET /api/users/me
 */
export interface UserProfileDTO {
  id: string;
  ai_usage_count: number;
  usage_period_start: string;
  monthly_limit: number;
  remaining_generations: number;
}

/**
 * Detailed AI usage information for the current user.
 * Returned by: GET /api/users/ai-usage
 */
export interface UserAiUsageDTO {
  can_generate: boolean;
  usage_count: number;
  monthly_limit: number;
  remaining_generations: number;
  period_start: string;
  period_end: string;
}

/**
 * Command to delete user account.
 * Required by: DELETE /api/users/me
 */
export interface DeleteUserCommand {
  confirmation: string;
}

/**
 * Response after successful account deletion.
 * Returned by: DELETE /api/users/me
 */
export interface DeleteUserResponseDTO {
  message: string;
}

// ============================================================================
// Summary DTOs - List Operations
// ============================================================================

/**
 * Summary item in list view (minimal fields).
 * Returned by: GET /api/summaries (array item)
 */
export interface SummaryListItemDTO {
  id: string;
  title: string;
  creation_type: Enums<"summary_creation_type">;
  ai_model_name: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Pagination metadata for list responses.
 */
export interface PaginationDTO {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

/**
 * Complete response for summary list endpoint.
 * Returned by: GET /api/summaries
 */
export interface SummaryListResponseDTO {
  summaries: SummaryListItemDTO[];
  pagination: PaginationDTO;
}

/**
 * Query parameters for listing summaries.
 * Used by: GET /api/summaries
 */
export interface SummaryListQueryParams {
  page?: number;
  limit?: number;
  sort?: "created_at" | "updated_at" | "title";
  order?: "asc" | "desc";
  creation_type?: Enums<"summary_creation_type">;
}

// ============================================================================
// Summary DTOs - Detail Operations
// ============================================================================

/**
 * Complete summary details including full content.
 * Returned by: GET /api/summaries/:id
 */
export interface SummaryDetailDTO {
  id: string;
  title: string;
  content: SummaryContentDTO;
  creation_type: Enums<"summary_creation_type">;
  ai_model_name: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Summary Commands - Create Operations
// ============================================================================

/**
 * Command to create a new manual summary.
 * Required by: POST /api/summaries
 */
export interface CreateManualSummaryCommand {
  title: string;
  content: SummaryContentDTO;
}

/**
 * Response after creating a manual summary.
 * Returned by: POST /api/summaries
 */
export type CreateManualSummaryResponseDTO = SummaryDetailDTO;

/**
 * Command to generate and save an AI summary.
 * Required by: POST /api/summaries/generate-ai
 */
export interface GenerateAiSummaryCommand {
  title: string;
  content: SummaryContentDTO;
  ai_model_name: string;
}

/**
 * Response after generating an AI summary, includes remaining generation count.
 * Returned by: POST /api/summaries/generate-ai
 */
export interface GenerateAiSummaryResponseDTO extends SummaryDetailDTO {
  remaining_generations: number;
}

// ============================================================================
// Summary Commands - Update Operations
// ============================================================================

/**
 * Command to partially update a summary.
 * All fields are optional, only provided fields will be updated.
 * Required by: PATCH /api/summaries/:id
 */
export interface UpdateSummaryCommand {
  title?: string;
  content?: Partial<SummaryContentDTO>;
}

/**
 * Response after updating a summary.
 * Returned by: PATCH /api/summaries/:id
 */
export type UpdateSummaryResponseDTO = SummaryDetailDTO;

// ============================================================================
// Summary Commands - Delete Operations
// ============================================================================

/**
 * Response after deleting a summary.
 * Returned by: DELETE /api/summaries/:id
 */
export interface DeleteSummaryResponseDTO {
  message: string;
  deleted_id: string;
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Standard error codes used across the API.
 */
export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "AI_LIMIT_EXCEEDED"
  | "INVALID_CONFIRMATION"
  | "INVALID_PARAMETER"
  | "INTERNAL_ERROR"
  | "DATABASE_ERROR";

/**
 * Error response structure returned by all API endpoints.
 */
export interface ApiErrorDTO {
  error: {
    code: ApiErrorCode;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Specific error response for AI limit exceeded.
 */
export interface AiLimitExceededErrorDTO {
  error: {
    code: "AI_LIMIT_EXCEEDED";
    message: string;
    current_usage: number;
    monthly_limit: number;
    reset_date: string;
  };
}

// ============================================================================
// Database Function Parameters
// ============================================================================

/**
 * Parameters for the create_ai_summary database function.
 */
export interface CreateAiSummaryFunctionParams {
  p_title: string;
  p_content: SummaryContentDTO;
  p_original_ai_content: SummaryContentDTO;
  p_ai_model_name: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if content matches SummaryContentDTO structure.
 */
export function isSummaryContent(value: unknown): value is SummaryContentDTO {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const content = value as Record<string, unknown>;
  const requiredFields: (keyof SummaryContentDTO)[] = [
    "research_objective",
    "methods",
    "results",
    "discussion",
    "open_questions",
    "conclusions",
  ];

  return requiredFields.every((field) => typeof content[field] === "string");
}

/**
 * Type guard to check if error response is AI limit exceeded error.
 */
export function isAiLimitExceededError(error: ApiErrorDTO): error is AiLimitExceededErrorDTO {
  return error.error.code === "AI_LIMIT_EXCEEDED";
}
