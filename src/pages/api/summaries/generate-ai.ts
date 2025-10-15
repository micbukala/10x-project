import { z } from "zod";
import type { APIRoute } from "astro";
import { SummaryService, AiLimitExceededError } from "../../../lib/services/summary.service";
import { generateAiSummarySchema } from "../../../lib/services/schemas/summary.schema";
import { ApiMonitoring } from "../../../../monitoring";
import { MONTHLY_AI_LIMIT } from "../../../lib/constants";
import type { GenerateAiSummaryResponseDTO } from "../../../types";

// Disable static prerendering for API routes
export const prerender = false;

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

    // Fetch updated user AI usage count to calculate remaining generations
    const { data: userData } = await locals.supabase.from("users").select("ai_usage_count").eq("id", user.id).single();

    const remainingGenerations = MONTHLY_AI_LIMIT - (userData?.ai_usage_count || 0);

    // Prepare response with remaining_generations
    const response: GenerateAiSummaryResponseDTO = {
      ...summary,
      remaining_generations: remainingGenerations,
    };

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
    return new Response(JSON.stringify(response), {
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
      userId: locals.user?.id,
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
