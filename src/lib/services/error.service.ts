import type { ApiErrorDTO, ApiErrorCode } from "../../types";
import { z } from "zod";
import { NotFoundError, ForbiddenError, AiLimitExceededError } from "./summary.service";

/**
 * Custom API error class for handling specific error cases
 */
export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly field?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Error service for handling API errors consistently
 */
export class ErrorService {
  /**
   * Create a standardized API error response
   */
  static createErrorResponse(error: Error | ApiError | z.ZodError): Response {
    const errorResponse: ApiErrorDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };

    let status = 500;

    if (error instanceof ApiError) {
      status = error.status;
      errorResponse.error = {
        code: error.code,
        message: error.message,
        ...(error.field && { field: error.field }),
        ...(error.details && { details: error.details }),
      };
    } else if (error instanceof NotFoundError) {
      status = 404;
      errorResponse.error = {
        code: "NOT_FOUND",
        message: error.message,
      };
    } else if (error instanceof ForbiddenError) {
      status = 403;
      errorResponse.error = {
        code: "FORBIDDEN",
        message: error.message,
      };
    } else if (error instanceof AiLimitExceededError) {
      status = 429;
      errorResponse.error = {
        code: "AI_LIMIT_EXCEEDED",
        message: error.message,
        details: {
          current_usage: error.currentUsage,
          monthly_limit: error.monthlyLimit,
          reset_date: error.resetDate,
        },
      };
    } else if (error instanceof z.ZodError) {
      status = 400;
      errorResponse.error = {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: error.flatten(),
      };
    } else if (error.message === "Summary not found") {
      status = 404;
      errorResponse.error = {
        code: "NOT_FOUND",
        message: error.message,
      };
    } else if (error.message === "Permission denied") {
      status = 403;
      errorResponse.error = {
        code: "FORBIDDEN",
        message: error.message,
      };
    } else {
      // Handle specific error messages for better user experience
      const message = error.message.toLowerCase();
      if (message.includes("not found")) {
        status = 404;
        errorResponse.error = {
          code: "NOT_FOUND",
          message: error.message,
        };
      } else if (message.includes("permission denied") || message.includes("forbidden")) {
        status = 403;
        errorResponse.error = {
          code: "FORBIDDEN",
          message: error.message,
        };
      } else if (message.includes("database")) {
        errorResponse.error = {
          code: "DATABASE_ERROR",
          message: "A database error occurred",
        };
      }
    }

    return new Response(JSON.stringify(errorResponse), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Create unauthorized error response
   */
  static createUnauthorizedResponse(message = "Authentication required"): Response {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message,
        },
      } as ApiErrorDTO),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  /**
   * Helper to throw an API error
   */
  static throw(
    code: ApiErrorCode,
    message: string,
    status: number,
    field?: string,
    details?: Record<string, unknown>
  ): never {
    throw new ApiError(code, message, status, field, details);
  }
}
