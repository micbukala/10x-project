import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client";
import type { ApiErrorDTO } from "../types";
import { ApiMonitoring } from "../../monitoring";
import { ErrorService } from "../lib/services/error.service";

// Create monitoring middleware
const monitoringMiddleware = ApiMonitoring.createMonitoringMiddleware();

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  // Get user from session if available
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  context.locals.user = user;

  // Set response headers for all API routes
  if (context.url.pathname.startsWith("/api/")) {
    context.locals.apiResponseHeaders = {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
    };
  }

  // For protected API routes, require authentication
  const isProtectedRoute =
    context.url.pathname.startsWith("/api/users/") || context.url.pathname.startsWith("/api/summaries/");

  if (isProtectedRoute && !user) {
    return ErrorService.createUnauthorizedResponse();
  }

  // Apply monitoring middleware for API routes
  if (context.url.pathname.startsWith("/api/")) {
    return monitoringMiddleware(context, next);
  }

  return next();
});
