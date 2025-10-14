import { z } from "zod";
import type { APIRoute } from "astro";
import { SummaryService, AiLimitExceededError } from "../../../lib/services/summary.service";
import { isSummaryContent } from "../../../types";
import { ApiMonitoring } from "../../../../monitoring";

// Disable static prerendering for API routes
export const prerender = false;

// Zod schema for request validation
const generateAiSummarySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.custom<SummaryContentDTO>((data) => isSummaryContent(data), "Invalid summary content structure"),
  ai_model_name: z.string().min(1, "AI model name is required"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();
  const endpoint = "/api/summaries/generate-ai";

  try {
    // Ensure user is authenticated
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        }),
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = generateAiSummarySchema.parse(body);

    // Initialize service with Supabase client from context
    const summaryService = new SummaryService(locals.supabase);

    // Create AI summary
    const summary = await summaryService.createAiSummary(
      user.id,
      validatedData.title,
      validatedData.content,
      validatedData.ai_model_name
    );

    // Log successful request
    ApiMonitoring.logApiRequest({
      timestamp: new Date().toISOString(),
      endpoint,
      method: "POST",
      userId: user.id,
      duration: Date.now() - startTime,
      statusCode: 201,
    });

    // Return successful response
    return new Response(JSON.stringify(summary), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.errors,
          },
        }),
        { status: 400 }
      );
    }

    // Handle AI limit exceeded error
    if (error instanceof AiLimitExceededError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "AI_LIMIT_EXCEEDED",
            message: "Monthly AI generation limit exceeded",
            current_usage: error.currentUsage,
            monthly_limit: error.monthlyLimit,
            reset_date: error.resetDate,
          },
        }),
        { status: 403 }
      );
    }

    // Log error request
    ApiMonitoring.logApiRequest({
      timestamp: new Date().toISOString(),
      endpoint,
      method: "POST",
      userId: user?.id,
      duration: Date.now() - startTime,
      statusCode: 500,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

    // Return generic error for other cases
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create AI summary",
        },
      }),
      { status: 500 }
    );
  }
};
