export function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !isHttpUrl(supabaseUrl)) {
    throw new Error(
      "Konfigurasi database aplikasi belum lengkap.",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function hasValidSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(supabaseUrl && supabaseAnonKey && isHttpUrl(supabaseUrl));
}

export function getSupabaseServiceRoleConfig() {
  const { supabaseUrl } = getSupabaseConfig();
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceRoleKey) {
    throw new Error("Konfigurasi admin database aplikasi belum lengkap.");
  }

  return { supabaseUrl, supabaseServiceRoleKey };
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
