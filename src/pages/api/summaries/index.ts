import type { APIRoute } from "astro";
import { summaryListQuerySchema, createManualSummarySchema } from "../../../lib/services/schemas/summary.schema";
import { SummaryService } from "../../../lib/services/summary.service";
import { ErrorService } from "../../../lib/services/error.service";
import { ApiMonitoring } from "../../../../monitoring";

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const { supabase, user } = locals;

    // Middleware handles authentication check
    if (!user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse and validate query parameters
    const params = Object.fromEntries(url.searchParams);
    const result = summaryListQuerySchema.safeParse(params);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: result.error.flatten(),
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize service and get summaries
    const summaryService = new SummaryService(supabase);
    const { page, limit, sort, order, creation_type } = result.data;

    const response = await summaryService.listSummaries(user.id, page, limit, sort, order, creation_type);

    // Set cache control headers
    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "private, max-age=0, must-revalidate",
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers,
    });
  } catch (error) {
    return ErrorService.createErrorResponse(error as Error);
  }
};

/**
 * POST /api/summaries
 * Create a new manual summary
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();
  const endpoint = "/api/summaries";

  try {
    // Check authentication
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      ApiMonitoring.logApiRequest({
        timestamp: new Date().toISOString(),
        endpoint,
        method: "POST",
        userId: user.id,
        duration: Date.now() - startTime,
        statusCode: 400,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON format",
        },
      });

      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid JSON format",
            details: { parseError: parseError instanceof Error ? parseError.message : "Unknown error" },
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate request body with Zod schema
    const validationResult = createManualSummarySchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      const field = firstError.path.join(".");

      ApiMonitoring.logApiRequest({
        timestamp: new Date().toISOString(),
        endpoint,
        method: "POST",
        userId: user.id,
        duration: Date.now() - startTime,
        statusCode: 400,
        error: {
          code: "VALIDATION_ERROR",
          message: firstError.message,
        },
      });

      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: firstError.message,
            field,
            details: validationResult.error.flatten(),
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract validated data
    const { title, content } = validationResult.data;

    // Create summary using SummaryService
    const summaryService = new SummaryService(locals.supabase);
    const summary = await summaryService.createManualSummary(user.id, title, content);

    // Log successful request
    ApiMonitoring.logApiRequest({
      timestamp: new Date().toISOString(),
      endpoint,
      method: "POST",
      userId: user.id,
      duration: Date.now() - startTime,
      statusCode: 201,
    });

    // Return created summary
    return new Response(JSON.stringify(summary), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error request
    ApiMonitoring.logApiRequest({
      timestamp: new Date().toISOString(),
      endpoint,
      method: "POST",
      userId: locals.user?.id,
      duration: Date.now() - startTime,
      statusCode: 500,
      error: {
        code: "DATABASE_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

    return ErrorService.createErrorResponse(error as Error);
  }
};
