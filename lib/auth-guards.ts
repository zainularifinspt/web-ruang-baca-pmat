import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-auth-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { hasValidSupabaseConfig } from "@/lib/supabase-config";
import { getUserAppRole } from "@/lib/app-roles";

export type StaffRole = "admin" | "dosen" | "petugas";

type RoleCheckResult =
  | { ok: true; role: StaffRole; user: User }
  | { ok: false; message: string };

export async function requireStaffRole(allowedRoles: StaffRole[]): Promise<RoleCheckResult> {
  if (!hasValidSupabaseConfig()) {
    return { ok: false, message: "Konfigurasi sistem belum lengkap." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Sesi login tidak ditemukan." };
  }

  const { data: profile, error: profileError } = await createSupabaseAdminClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = getUserAppRole(user, profile?.role);

  if (profileError || (role !== "admin" && role !== "dosen" && role !== "petugas")) {
    return { ok: false, message: "Role akun tidak memiliki akses staf." };
  }

  if (!allowedRoles.includes(role)) {
    return { ok: false, message: "Role akun tidak memiliki izin untuk aksi ini." };
  }

  return { ok: true, role, user };
}
