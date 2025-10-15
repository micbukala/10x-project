import type { APIRoute } from "astro";
import { z } from "zod";
import { ErrorService, ApiError } from "../../../lib/services/error.service";
import { uuidSchema, summaryIdSchema } from "../../../lib/services/schemas/summary.schema";
import { SummaryService } from "../../../lib/services/summary.service";
import type { UpdateSummaryCommand, ApiErrorDTO, SummaryContentDTO } from "../../../types";
import { ApiMonitoring } from "../../../../monitoring";

// Disable static prerendering for API routes
export const prerender = false;

/**
 * Delete a summary by ID
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  const startTime = Date.now();
  const endpoint = `/api/summaries/${params.id}`;
  let userId: string | undefined;

  try {
    const { supabase, user } = locals;
    userId = user?.id;

    if (!user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
    }

    // Validate summary ID format
    const validationResult = summaryIdSchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_PARAMETER",
            message: "Invalid summary ID format",
            details: validationResult.error.flatten(),
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { id } = validationResult.data;

    // Initialize service and delete summary
    const summaryService = new SummaryService(supabase);
    const response = await summaryService.deleteSummary(user.id, id);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in DELETE /api/summaries/:id:", error);
    if (error instanceof Error || error instanceof z.ZodError || error instanceof ApiError) {
      return ErrorService.createErrorResponse(error);
    }
    return ErrorService.createErrorResponse(new Error("An unexpected error occurred"));
  } finally {
    const duration = Date.now() - startTime;
    ApiMonitoring.logApiRequest({
      timestamp: new Date().toISOString(),
      endpoint,
      method: "DELETE",
      userId,
      duration,
      statusCode: 200,
      operationType: "delete",
    });
  }
};

/**
 * Get a single summary by ID
 * @see https://docs.astro.build/en/core-concepts/endpoints/#api-routes
 */
export const GET: APIRoute = async ({ locals, params }) => {
  const startTime = Date.now();
  const endpoint = `/api/summaries/${params.id}`;
  let userId: string | undefined;

  try {
    // Ensure user is authenticated
    const { user, supabase } = locals;
    userId = user?.id;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        } as ApiErrorDTO),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate summary ID
    const summaryId = params.id;
    if (!summaryId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Summary ID is required",
            field: "id",
          },
        } as ApiErrorDTO),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    const idResult = uuidSchema.safeParse(summaryId);
    if (!idResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid summary ID format",
            field: "id",
          },
        } as ApiErrorDTO),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Initialize service and get summary (user is guaranteed by middleware)
    const summaryService = new SummaryService(supabase);
    const summary = await summaryService.getSummaryById(user!.id, summaryId);

    // Log successful request
    ApiMonitoring.logApiRequest({
      timestamp: new Date().toISOString(),
      endpoint,
      method: "GET",
      userId,
      duration: Date.now() - startTime,
      statusCode: 200,
    });

    // Set cache control headers and return response
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    // Log error and create error response
    const err = error as Error | z.ZodError;
    console.error(`Error in GET /api/summaries/${params.id}:`, err);

    // Log error request
    ApiMonitoring.logApiRequest({
      timestamp: new Date().toISOString(),
      endpoint,
      method: "GET",
      userId,
      duration: Date.now() - startTime,
      statusCode: 500,
      error: {
        code: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "An unexpected error occurred",
        stack: err instanceof Error ? err.stack : undefined,
      },
    });

    return ErrorService.createErrorResponse(err);
  }
};

// Zod schema for request validation
/**
 * Zod schema for validating summary update requests.
 * At least one field (title or content) must be provided.
 */
const updateSummarySchema = z
  .object({
    title: z.string().trim().min(1, "Title cannot be empty").optional(),
    content: z
      .custom<Partial<SummaryContentDTO>>((data) => {
        if (!data) return true;
        if (typeof data !== "object" || data === null) return false;

        const contentFields = [
          "research_objective",
          "methods",
          "results",
          "discussion",
          "open_questions",
          "conclusions",
        ];
        return Object.entries(data as Record<string, unknown>).every(
          ([key, value]) => contentFields.includes(key) && typeof value === "string"
        );
      }, "Invalid summary content structure")
      .optional(),
  })
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: "At least one field (title or content) must be provided",
  });

/**
 * Updates an existing summary partially (title and/or content).
 * @see https://docs.astro.build/en/core-concepts/endpoints/#api-routes
 */
export const PATCH: APIRoute = async ({ request, locals, params }) => {
  const startTime = Date.now();
  const endpoint = `/api/summaries/${params.id}`;
  let userId: string | undefined;

  try {
    // Authentication is handled by middleware
    const { user } = locals;
    userId = user?.id;

    // Validate summary ID
    const summaryId = params.id;
    if (!summaryId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(summaryId)) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid summary ID format",
            field: "id",
          },
        } as ApiErrorDTO),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateSummarySchema.parse(body) as UpdateSummaryCommand;

    // Ensure user is authenticated
    if (!user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
    }

    // Initialize service with Supabase client from context
    const summaryService = new SummaryService(locals.supabase);

    // Update summary
    const updatedSummary = await summaryService.updateSummary(
      user.id,
      summaryId,
      validatedData.title,
      validatedData.content
    );

    // Log successful request
    ApiMonitoring.logApiRequest({
      timestamp: new Date().toISOString(),
      endpoint,
      method: "PATCH",
      userId,
      duration: Date.now() - startTime,
      statusCode: 200,
    });

    // Return successful response
    return new Response(JSON.stringify(updatedSummary), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    let status = 500;
    let errorCode: ApiErrorDTO["error"]["code"] = "INTERNAL_ERROR";
    let message = "An unexpected error occurred";
    let field: string | undefined;

    // Handle validation errors
    if (error instanceof z.ZodError) {
      status = 400;
      errorCode = "VALIDATION_ERROR";
      message = error.errors[0]?.message || "Invalid request data";
      field = error.errors[0]?.path?.join(".") || undefined;
    }
    // Handle not found
    else if (error instanceof Error && error.message === "Summary not found") {
      status = 404;
      errorCode = "NOT_FOUND";
      message = "Summary not found";
    }
    // Handle forbidden
    else if (error instanceof Error && error.message === "Permission denied") {
      status = 403;
      errorCode = "FORBIDDEN";
      message = "You do not have permission to update this summary";
    }
    // Handle database errors
    else if (error instanceof Error && error.message.includes("database")) {
      status = 500;
      errorCode = "DATABASE_ERROR";
      message = "Failed to update summary";
    }

    // Log error request
    ApiMonitoring.logApiRequest({
      timestamp: new Date().toISOString(),
      endpoint,
      method: "PATCH",
      userId,
      duration: Date.now() - startTime,
      statusCode: status,
      error: {
        code: errorCode,
        message,
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

    // Return error response
    return new Response(
      JSON.stringify({
        error: {
          code: errorCode,
          message,
          ...(field && { field }),
        },
      } as ApiErrorDTO),
      {
        status,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
