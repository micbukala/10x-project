import type { APIContext } from "astro";
import type { ApiErrorDTO } from "../src/types";

/**
 * Interface for structured logging of API requests
 */
interface ApiRequestLog {
  timestamp: string;
  endpoint: string;
  method: string;
  userId?: string;
  duration: number;
  statusCode: number;
  operationType?: "create" | "read" | "update" | "delete";
  error?: {
    code: ApiErrorDTO["error"]["code"];
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Interface for API performance metrics
 */
interface ApiMetrics {
  endpoint: string;
  requestCount: number;
  averageResponseTime: number;
  errorCount: number;
  errorRate: number;
  lastError?: {
    code: ApiErrorDTO["error"]["code"];
    message: string;
    timestamp: string;
  };
}

/**
 * Class for handling API monitoring and logging
 */
export class ApiMonitoring {
  static metrics = new Map<string, ApiMetrics>();
  private static readonly ALERT_ERROR_RATE_THRESHOLD = 0.05; // 5%

  /**
   * Logs API request details in a structured format
   */
  static logApiRequest(log: ApiRequestLog): void {
    // In production, replace with proper logging service
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(log));

    // Update metrics
    this.updateMetrics(log);

    // Check error rate and alert if needed
    this.checkErrorRate(log.endpoint);
  }

  /**
   * Updates API metrics for monitoring
   */
  private static updateMetrics(log: ApiRequestLog): void {
    const current = this.metrics.get(log.endpoint) || {
      endpoint: log.endpoint,
      requestCount: 0,
      averageResponseTime: 0,
      errorCount: 0,
      errorRate: 0,
    };

    // Update metrics
    current.requestCount++;
    current.averageResponseTime =
      (current.averageResponseTime * (current.requestCount - 1) + log.duration) / current.requestCount;

    if (log.statusCode >= 400) {
      current.errorCount++;
    }

    current.errorRate = current.errorCount / current.requestCount;

    this.metrics.set(log.endpoint, current);
  }

  /**
   * Checks error rate and triggers alerts if threshold is exceeded
   */
  private static checkErrorRate(endpoint: string): void {
    const metrics = this.metrics.get(endpoint);
    if (!metrics) return;

    if (metrics.errorRate > this.ALERT_ERROR_RATE_THRESHOLD) {
      this.triggerErrorRateAlert(metrics);
    }
  }

  /**
   * Triggers an alert when error rate exceeds threshold
   */
  private static triggerErrorRateAlert(metrics: ApiMetrics): void {
    // In production, integrate with alert service (e.g., PagerDuty)
    // eslint-disable-next-line no-console
    console.error(`HIGH ERROR RATE ALERT: ${metrics.endpoint} has ${metrics.errorRate * 100}% error rate`);
  }

  /**
   * Creates a middleware wrapper for monitoring API endpoints
   */
  static createMonitoringMiddleware() {
    return async function monitoringMiddleware(context: APIContext, next: () => Promise<Response>) {
      const startTime = Date.now();
      let response: Response;

      try {
        // Execute the route handler
        response = await next();

        // Log the request
        ApiMonitoring.logApiRequest({
          timestamp: new Date().toISOString(),
          endpoint: context.url.pathname,
          method: context.request.method,
          userId: context.locals.user?.id,
          duration: Date.now() - startTime,
          statusCode: response.status,
        });

        return response;
      } catch (error) {
        // Log error and re-throw
        ApiMonitoring.logApiRequest({
          timestamp: new Date().toISOString(),
          endpoint: context.url.pathname,
          method: context.request.method,
          userId: context.locals.user?.id,
          duration: Date.now() - startTime,
          statusCode: 500,
          error: {
            code: "INTERNAL_ERROR",
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
          },
        });

        throw error;
      }
    };
  }
}

// Export metrics for monitoring dashboard
export function getApiMetrics(): ApiMetrics[] {
  return Array.from(ApiMonitoring.metrics.values());
}
