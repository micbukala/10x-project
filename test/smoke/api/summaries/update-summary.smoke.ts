import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase } from "../../../utils/supabase.mock";
import { SummaryService } from "../../../../src/lib/services/summary.service";
import type { SummaryContentDTO } from "../../../../src/types";

describe("PATCH /api/summaries/:id", () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  let summaryService: SummaryService;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    summaryService = new SummaryService(mockSupabase);
  });

  it("should update summary title only", async () => {
    const userId = "test-user-id";
    const summaryId = "test-summary-id";
    const newTitle = "Updated Title";

    const mockSummary = {
      id: summaryId,
      user_id: userId,
      title: "Original Title",
      content: {
        research_objective: "Original objective",
        methods: "Original methods",
        results: "Original results",
        discussion: "Original discussion",
        open_questions: "Original questions",
        conclusions: "Original conclusions",
      },
      creation_type: "manual",
      ai_model_name: null,
      created_at: "2025-10-14T10:00:00Z",
      updated_at: "2025-10-14T10:00:00Z",
    };

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: mockSummary, error: null }),
    });

    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: { ...mockSummary, title: newTitle },
        error: null,
      }),
    });

    const result = await summaryService.updateSummary(userId, summaryId, newTitle);

    expect(result.title).toBe(newTitle);
    expect(result.content).toEqual(mockSummary.content);
  });

  it("should update summary content partially", async () => {
    const userId = "test-user-id";
    const summaryId = "test-summary-id";
    const contentUpdate: Partial<SummaryContentDTO> = {
      research_objective: "Updated objective",
      methods: "Updated methods",
    };

    const mockSummary = {
      id: summaryId,
      user_id: userId,
      title: "Test Title",
      content: {
        research_objective: "Original objective",
        methods: "Original methods",
        results: "Original results",
        discussion: "Original discussion",
        open_questions: "Original questions",
        conclusions: "Original conclusions",
      },
      creation_type: "manual",
      ai_model_name: null,
      created_at: "2025-10-14T10:00:00Z",
      updated_at: "2025-10-14T10:00:00Z",
    };

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: mockSummary, error: null }),
    });

    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: {
          ...mockSummary,
          content: {
            ...mockSummary.content,
            ...contentUpdate,
          },
        },
        error: null,
      }),
    });

    const result = await summaryService.updateSummary(userId, summaryId, undefined, contentUpdate);

    expect(result.title).toBe(mockSummary.title);
    expect(result.content.research_objective).toBe(contentUpdate.research_objective);
    expect(result.content.methods).toBe(contentUpdate.methods);
    expect(result.content.results).toBe(mockSummary.content.results);
  });

  it("should throw error when user is not the owner", async () => {
    const userId = "test-user-id";
    const summaryId = "test-summary-id";
    const newTitle = "Updated Title";

    const mockSummary = {
      id: summaryId,
      user_id: "different-user-id",
      title: "Original Title",
      content: {
        research_objective: "Original objective",
        methods: "Original methods",
        results: "Original results",
        discussion: "Original discussion",
        open_questions: "Original questions",
        conclusions: "Original conclusions",
      },
    };

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: mockSummary, error: null }),
    });

    await expect(summaryService.updateSummary(userId, summaryId, newTitle)).rejects.toThrow("Permission denied");
  });
});
