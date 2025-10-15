import type { SupabaseClient } from "../../db/supabase.client";
import type { Database } from "../../db/database.types";
import type {
  CreateAiSummaryFunctionParams,
  SummaryDetailDTO,
  SummaryContentDTO,
  GenerateAiSummaryResponseDTO,
  ApiErrorDTO,
  PaginationDTO,
  SummaryListResponseDTO,
  SummaryListItemDTO,
  DeleteSummaryResponseDTO,
} from "../../types";

import type { Json } from "../../db/database.types";

export class AiLimitExceededError extends Error {
  constructor(
    public currentUsage: number,
    public monthlyLimit: number,
    public resetDate: string
  ) {
    super("AI generation limit exceeded");
    this.name = "AiLimitExceededError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Summary not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Permission denied") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class SummaryService {
  private readonly MONTHLY_AI_LIMIT = 5;

  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Create a new manual summary
   * @param userId - ID of the user creating the summary
   * @param title - Title of the summary
   * @param content - Structured content of the summary
   * @returns Promise resolving to the created summary details
   * @throws Error if there's a database error during creation
   */
  async createManualSummary(userId: string, title: string, content: SummaryContentDTO): Promise<SummaryDetailDTO> {
    // Prepare insert data
    const insertData = {
      user_id: userId,
      title: title,
      content: content as unknown as Json,
      creation_type: "manual" as const,
      ai_model_name: null,
    };

    // Insert the summary
    const { data: summary, error } = await this.supabase.from("summaries").insert(insertData).select().single();

    if (error) {
      console.error("Database error while creating manual summary:", error);
      throw new Error("Failed to create summary: Database error");
    }

    if (!summary) {
      throw new Error("Failed to create summary: No data returned");
    }

    // Return typed response
    return {
      id: summary.id,
      title: summary.title,
      content: summary.content as unknown as SummaryContentDTO,
      creation_type: summary.creation_type,
      ai_model_name: summary.ai_model_name,
      created_at: summary.created_at,
      updated_at: summary.updated_at,
    } as SummaryDetailDTO;
  }

  /**
   * Delete a summary by ID
   * @param userId - ID of the user attempting to delete the summary
   * @param summaryId - ID of the summary to delete
   * @returns Promise resolving to the ID of the deleted summary
   * @throws NotFoundError if summary doesn't exist
   * @throws ForbiddenError if user doesn't have permission
   * @throws Error if there's a database error during deletion
   */
  async deleteSummary(userId: string, summaryId: string): Promise<DeleteSummaryResponseDTO> {
    // Fetch summary to verify existence and ownership
    const { data: summary, error: fetchError } = await this.supabase
      .from("summaries")
      .select("id, user_id")
      .eq("id", summaryId)
      .single();

    if (fetchError) {
      console.error("Database error while fetching summary:", fetchError);
      throw new NotFoundError();
    }

    if (!summary) {
      throw new NotFoundError();
    }

    // Verify ownership
    if (summary.user_id !== userId) {
      throw new ForbiddenError();
    }

    // Delete the summary
    const { error: deleteError } = await this.supabase.from("summaries").delete().eq("id", summaryId);

    if (deleteError) {
      console.error("Database error while deleting summary:", deleteError);
      throw new Error("Failed to delete summary: Database error");
    }

    return {
      message: "Summary deleted successfully",
      deleted_id: summaryId,
    };
  }

  async updateSummary(
    userId: string,
    summaryId: string,
    title?: string,
    contentUpdate?: Partial<SummaryContentDTO>
  ): Promise<SummaryDetailDTO> {
    // Fetch current summary to check ownership and get current values
    const { data: summary, error: fetchError } = await this.supabase
      .from("summaries")
      .select("*")
      .eq("id", summaryId)
      .single();

    if (fetchError || !summary) {
      throw new NotFoundError();
    }

    // Check ownership
    if (summary.user_id !== userId) {
      throw new ForbiddenError();
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Update title if provided
    if (title !== undefined) {
      updateData.title = title;
    }

    // Update content if provided (merge with existing content)
    if (contentUpdate) {
      const existingContent = summary.content as unknown as SummaryContentDTO;
      const mergedContent = {
        ...existingContent,
        ...contentUpdate,
      };
      updateData.content = mergedContent as unknown as Json;
    }

    // Update the summary
    const { data: updatedSummary, error: updateError } = await this.supabase
      .from("summaries")
      .update(updateData)
      .eq("id", summaryId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update summary: ${updateError.message}`);
    }

    if (!updatedSummary) {
      throw new Error("Failed to update summary: No data returned");
    }

    return {
      ...updatedSummary,
      content: updatedSummary.content as unknown as SummaryContentDTO,
    } as SummaryDetailDTO;
  }

  async createAiSummary(
    userId: string,
    title: string,
    content: SummaryContentDTO,
    aiModelName: string
  ): Promise<GenerateAiSummaryResponseDTO> {
    // Check AI usage limit
    const { data: user, error: userError } = await this.supabase
      .from("users")
      .select("ai_usage_count, usage_period_start")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      throw new NotFoundError("User not found");
    }

    // Validate AI usage limit
    if (user.ai_usage_count >= this.MONTHLY_AI_LIMIT) {
      const resetDate = new Date(user.usage_period_start);
      resetDate.setMonth(resetDate.getMonth() + 1);
      resetDate.setHours(0, 0, 0, 0);

      throw new AiLimitExceededError(user.ai_usage_count, this.MONTHLY_AI_LIMIT, resetDate.toISOString());
    }

    // Create AI summary using database function
    const params: CreateAiSummaryFunctionParams = {
      p_title: title,
      p_content: content,
      p_original_ai_content: content,
      p_ai_model_name: aiModelName,
    };

    const { data: summary, error: summaryError } = await this.supabase.rpc("create_ai_summary", params).single();

    if (summaryError) {
      throw new Error("Failed to create AI summary");
    }

    // Calculate remaining generations
    const remainingGenerations = this.MONTHLY_AI_LIMIT - (user.ai_usage_count + 1);

    // Cast summary to proper type for response
    const summaryResponse = summary as unknown as Omit<GenerateAiSummaryResponseDTO, "remaining_generations">;

    return {
      ...summary,
      remaining_generations: remainingGenerations,
    };
  }

  /**
   * List summaries with pagination and filtering
   */
  async listSummaries(
    userId: string,
    page: number,
    limit: number,
    sort: "created_at" | "updated_at" | "title",
    order: "asc" | "desc",
    creationType?: "manual" | "ai"
  ): Promise<SummaryListResponseDTO> {
    const offset = (page - 1) * limit;

    // Build query
    let query = this.supabase
      .from("summaries")
      .select("id, title, creation_type, ai_model_name, created_at, updated_at", {
        count: "exact",
      })
      .eq("user_id", userId)
      .order(sort, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    // Add creation type filter if specified
    if (creationType) {
      query = query.eq("creation_type", creationType);
    }

    // Execute query
    const { data: summaries, count, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch summaries: ${error.message}`);
    }

    if (!count) {
      throw new Error("Failed to get total count of summaries");
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const pagination: PaginationDTO = {
      current_page: page,
      total_pages: totalPages,
      total_items: count,
      items_per_page: limit,
    };

    return {
      summaries: summaries as SummaryListItemDTO[],
      pagination,
    };
  }

  /**
   * Get a single summary by ID
   */
  async getSummaryById(userId: string, summaryId: string): Promise<SummaryDetailDTO> {
    const { data: summary, error } = await this.supabase.from("summaries").select("*").eq("id", summaryId).single();

    if (error || !summary) {
      throw new NotFoundError();
    }

    // Check ownership
    if (summary.user_id !== userId) {
      throw new ForbiddenError();
    }

    return {
      ...summary,
      content: summary.content as unknown as SummaryContentDTO,
    } as SummaryDetailDTO;
  }
}
