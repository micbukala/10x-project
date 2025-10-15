import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

export const createMockSupabase = () => {
  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));

  const mockRpc = vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  });

  return {
    from: mockFrom,
    rpc: mockRpc,
  } as unknown as SupabaseClient;
};
