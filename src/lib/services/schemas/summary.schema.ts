import { z } from "zod";

/**
 * Schema for validating UUID format of summary ID
 */
export const summaryIdSchema = z.object({
  id: z.string().uuid({ message: "Invalid summary ID format" }),
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
 * Types inferred from the schemas
 */
export type ValidatedListQuery = z.infer<typeof summaryListQuerySchema>;
