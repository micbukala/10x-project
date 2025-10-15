import type { SupabaseClient } from "../../db/supabase.client";

import { MONTHLY_AI_LIMIT } from "../constants";
import type { UserProfileDTO, UserAiUsageDTO } from "../../types";

/**
 * Service for managing user-related operations
 */
export class UserService {
  /**
   * Retrieves detailed AI usage information for a user
   * Automatically resets the usage counter if a new month has started
   *
   * @param supabase - Authenticated Supabase client
   * @param userId - User's unique identifier
   * @returns Detailed AI usage information with period and limits
   * @throws Error if database query fails
   */
  async getAiUsage(supabase: SupabaseClient, userId: string): Promise<UserAiUsageDTO> {
    // Get current user data
    const { data: userData, error: selectError } = await supabase
      .from("users")
      .select("ai_usage_count, usage_period_start")
      .eq("id", userId)
      .single();

    if (selectError || !userData) {
      throw new Error(`Failed to fetch user AI usage: ${selectError?.message || "User not found"}`);
    }

    // Calculate current month period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let usageCount = userData.ai_usage_count;
    let actualPeriodStart = new Date(userData.usage_period_start);

    // Check if we need to reset the counter for new month
    if (actualPeriodStart < periodStart) {
      const { data: updatedData, error: updateError } = await supabase
        .from("users")
        .update({
          ai_usage_count: 0,
          usage_period_start: periodStart.toISOString(),
        })
        .eq("id", userId)
        .select("ai_usage_count, usage_period_start")
        .single();

      if (updateError || !updatedData) {
        throw new Error(`Failed to reset AI usage counter: ${updateError?.message || "Unknown error"}`);
      }

      usageCount = updatedData.ai_usage_count;
      actualPeriodStart = new Date(updatedData.usage_period_start);
    }

    // Calculate response data
    const remainingGenerations = MONTHLY_AI_LIMIT - usageCount;
    const canGenerate = remainingGenerations > 0;

    return {
      can_generate: canGenerate,
      usage_count: usageCount,
      monthly_limit: MONTHLY_AI_LIMIT,
      remaining_generations: remainingGenerations,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
    };
  }

  /**
   * Retrieves the user profile including AI usage statistics
   *
   * @param supabase - Authenticated Supabase client
   * @param userId - User's unique identifier
   * @returns User profile with AI usage data or null if not found
   * @throws Error if database query fails
   */
  async getUserProfile(supabase: SupabaseClient, userId: string): Promise<UserProfileDTO | null> {
    const { data, error } = await supabase
      .from("users")
      .select("id, ai_usage_count, usage_period_start")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      ai_usage_count: data.ai_usage_count,
      usage_period_start: data.usage_period_start,
      monthly_limit: MONTHLY_AI_LIMIT,
      remaining_generations: MONTHLY_AI_LIMIT - data.ai_usage_count,
    };
  }
}

export const userService = new UserService();
