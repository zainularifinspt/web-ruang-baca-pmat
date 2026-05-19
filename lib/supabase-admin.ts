import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleConfig } from "@/lib/supabase-config";

export function createSupabaseAdminClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseServiceRoleConfig();

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
