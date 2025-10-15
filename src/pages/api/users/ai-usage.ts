import type { APIContext } from "astro";
import { userService } from "../../../lib/services/user.service";
import { ErrorService, ApiError } from "../../../lib/services/error.service";

export const prerender = false;

/**
 * GET /api/users/ai-usage
 *
 * Retrieves the current user's AI usage statistics including:
 * - Usage count for current month
 * - Monthly limit
 * - Remaining generations
 * - Billing period (start/end)
 * - Whether user can generate more summaries
 *
 * Automatically resets usage counter when a new month starts.
 *
 * @returns 200 OK with UserAiUsageDTO
 * @returns 401 Unauthorized if authentication fails
 * @returns 500 Internal Error if database operation fails
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    // Handle authentication errors
    if (authError || !user) {
      return ErrorService.createUnauthorizedResponse();
    }

    // Get AI usage information from service
    const aiUsage = await userService.getAiUsage(context.locals.supabase, user.id);

    // Return successful response
    return new Response(JSON.stringify(aiUsage), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error for debugging
    console.error("Error in GET /api/users/ai-usage:", error);

    // Return error response based on error type
    if (error instanceof Error) {
      return ErrorService.createErrorResponse(
        new ApiError("INTERNAL_ERROR", "Failed to retrieve AI usage information", 500)
      );
    }

    // Fallback for unknown error types
    return ErrorService.createErrorResponse(new ApiError("INTERNAL_ERROR", "An unexpected error occurred", 500));
  }
}
