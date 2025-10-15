import { z } from "zod";
import type { SummaryContentDTO } from "../../../types";

/**
 * Schema for validating UUID format of summary ID
 */
export const summaryIdSchema = z.object({
  id: z.string().uuid({ message: "Invalid summary ID format" }),
});

/**
 * Schema for validating summary content structure
 * All 6 fields are required with maximum length of 50,000 characters each
 */
export const summaryContentSchema = z.object({
  research_objective: z.string().max(50000, "Research objective cannot exceed 50,000 characters"),
  methods: z.string().max(50000, "Methods cannot exceed 50,000 characters"),
  results: z.string().max(50000, "Results cannot exceed 50,000 characters"),
  discussion: z.string().max(50000, "Discussion cannot exceed 50,000 characters"),
  open_questions: z.string().max(50000, "Open questions cannot exceed 50,000 characters"),
  conclusions: z.string().max(50000, "Conclusions cannot exceed 50,000 characters"),
}) satisfies z.ZodType<SummaryContentDTO>;

/**
 * Schema for validating manual summary creation request
 */
export const createManualSummarySchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty").max(500, "Title cannot exceed 500 characters"),
  content: summaryContentSchema,
});

/**
 * Schema for validating summary list query parameters
 */
export const summaryListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().positive("Page must be a positive integer").default(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100).default(20)),
  sort: z.enum(["created_at", "updated_at", "title"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  creation_type: z.enum(["manual", "ai"]).optional(),
});

/**
 * Schema for validating UUID parameters
 */
export const uuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, "Invalid UUID format");

/**
 * Schema for validating AI summary generation request
 */
export const generateAiSummarySchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty").max(500, "Title cannot exceed 500 characters"),
  content: summaryContentSchema,
  ai_model_name: z.string().min(1, "AI model name is required").max(100, "AI model name cannot exceed 100 characters"),
});

/**
 * Schema for validating user account deletion request
 */
export const deleteUserSchema = z.object({
  confirmation: z.literal("DELETE", {
    errorMap: () => ({ message: 'Confirmation must be exactly "DELETE"' }),
  }),
});

/**
 * Types inferred from the schemas
 */
export type ValidatedListQuery = z.infer<typeof summaryListQuerySchema>;
export type ValidatedCreateManualSummary = z.infer<typeof createManualSummarySchema>;
