import type { SupabaseClient } from "../../db/supabase.client";

import { MONTHLY_AI_LIMIT } from "../constants";
import type { UserProfileDTO } from "../../types";

/**
 * Service for managing user-related operations
 */
export class UserService {
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
