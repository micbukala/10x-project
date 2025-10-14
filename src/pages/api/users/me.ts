import type { APIRoute } from "astro";

import { userService } from "../../../lib/services/user.service";
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
