import type { APIRoute } from "astro";

import { userService } from "../../../lib/services/user.service";
import { deleteUserSchema } from "../../../lib/services/schemas/summary.schema";
import type { ApiErrorDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/users/me
 *
 * Retrieves the authenticated user's profile information including AI usage statistics.
 *
 * @requires Authentication via JWT Bearer token
 * @returns {UserProfileDTO} 200 - User profile with AI usage data
 * @returns {ApiErrorDTO} 401 - Authentication required
 * @returns {ApiErrorDTO} 500 - Internal server error
 */
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
      // User profile not found for authenticated user - this should not happen with valid auth
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
    // Log error for monitoring (in production, use proper logging service)
    // eslint-disable-next-line no-console
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

/**
 * DELETE /api/users/me
 *
 * Permanently delete the authenticated user's account and all associated data.
 * This action is irreversible.
 *
 * @requires Authentication via JWT Bearer token
 * @requires Body with { confirmation: "DELETE" }
 * @returns {DeleteUserResponseDTO} 200 - Account successfully deleted
 * @returns {ApiErrorDTO} 400 - Invalid confirmation
 * @returns {ApiErrorDTO} 401 - Authentication required
 * @returns {ApiErrorDTO} 500 - Internal server error
 */
export const DELETE: APIRoute = async (context) => {
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
    // Parse and validate request body
    let body;
    try {
      body = await context.request.json();
    } catch {
      const errorResponse: ApiErrorDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON format",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate confirmation with Zod schema
    const validationResult = deleteUserSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      const errorResponse: ApiErrorDTO = {
        error: {
          code: "INVALID_CONFIRMATION",
          message: firstError.message,
          field: "confirmation",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete user account (cascades to summaries via DB constraints)
    const result = await userService.deleteUserAccount(supabase, userId);

    if (!result.success) {
      const errorResponse: ApiErrorDTO = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete user account",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        message: "Account successfully deleted",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log error for monitoring
    // eslint-disable-next-line no-console
    console.error("Failed to delete user account:", error);
    const errorResponse: ApiErrorDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete user account",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
