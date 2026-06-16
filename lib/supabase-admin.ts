import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleConfig } from "@/lib/supabase-config";

let cachedAdminClient: SupabaseClient | null = null;

export function createSupabaseAdminClient() {
  if (cachedAdminClient) return cachedAdminClient;

  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseServiceRoleConfig();

  cachedAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedAdminClient;
}
