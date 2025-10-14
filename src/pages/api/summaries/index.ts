import type { APIRoute } from "astro";
import { summaryListQuerySchema } from "../../lib/services/schemas/summary.schema";
import { SummaryService } from "../../lib/services/summary.service";
import { ErrorService } from "../../lib/services/error.service";

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const { supabase, user } = locals;

    // Middleware handles authentication check

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
    console.error("Error in GET /api/summaries:", error);
    return ErrorService.createErrorResponse(error);
  }
};
