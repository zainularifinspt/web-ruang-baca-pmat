"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-auth-server";
import { hasValidSupabaseConfig } from "@/lib/supabase-config";
import { getUserAppRole } from "@/lib/app-roles";

export type UpdateProfileResult = {
  ok: boolean;
  message: string;
};

export async function updateOwnProfileName(fullNameInput: string): Promise<UpdateProfileResult> {
  if (!hasValidSupabaseConfig()) {
    return failure("Konfigurasi Supabase belum lengkap.");
  }

  const fullName = fullNameInput.trim().replace(/\s+/g, " ");

  if (fullName.length < 3) return failure("Nama tampilan minimal 3 karakter.");
  if (fullName.length > 120) return failure("Nama tampilan maksimal 120 karakter.");

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return failure("Sesi login tidak ditemukan.");
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: currentProfile, error: currentProfileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (currentProfileError) return failure(currentProfileError.message);

    const role = getUserAppRole(user, currentProfile?.role) ?? "petugas";
    const metadata = {
      ...(user.user_metadata ?? {}),
      app_role: role,
      full_name: fullName,
      name: fullName,
    };

    const [{ error: authError }, { error: profileError }] = await Promise.all([
      supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: metadata,
      }),
      supabaseAdmin.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? null,
          full_name: fullName,
          role,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      ),
    ]);

    if (authError) return failure(authError.message);
    if (profileError) return failure(profileError.message);

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/profil");
    revalidatePath("/dashboard/pengguna");

    return { ok: true, message: "Nama tampilan berhasil diperbarui." };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Gagal memperbarui profil.");
  }
}

function failure(message: string): UpdateProfileResult {
  return { ok: false, message };
}
