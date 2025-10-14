import type { APIRoute } from "astro";
import { getApiMetrics } from "../../../monitoring";
import { ErrorService } from "../../lib/services/error.service";

/**
 * GET /api/metrics
 *
 * Internal endpoint for retrieving API metrics.
 * Should be protected and only accessible by monitoring systems.
 */
export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Ensure user is authenticated and has admin role
    const user = locals.user;
    if (!user || user.role !== "admin") {
      return ErrorService.createUnauthorizedResponse("Admin access required");
    }

    const metrics = getApiMetrics();

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    // Log and return error
    console.error("Error in GET /api/metrics:", error);
    return ErrorService.createErrorResponse(error as Error);
  }
};
