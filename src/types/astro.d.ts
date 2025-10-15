import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Extend the Astro locals with our custom properties
 */
declare module "astro" {
  interface Locals {
    supabase: SupabaseClient;
    user: {
      id: string;
      aud: string;
      role: string;
    } | null;
    apiResponseHeaders?: Record<string, string>;
  }
}
