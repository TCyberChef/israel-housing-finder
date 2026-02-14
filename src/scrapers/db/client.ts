import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Create and return a Supabase client using service_role key.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.
 *
 * Uses service_role key (not anon key) for full write access
 * to listings and dedupe_hashes tables.
 */
export function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url) {
    throw new Error(
      "SUPABASE_URL is not set. Get it from Supabase Dashboard -> Project Settings -> API -> Project URL"
    );
  }

  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_KEY is not set. Get it from Supabase Dashboard -> Project Settings -> API -> service_role secret (NOT anon key)"
    );
  }

  return createClient(url, serviceKey);
}
