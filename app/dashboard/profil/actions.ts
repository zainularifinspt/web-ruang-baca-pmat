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
    return failure("Konfigurasi sistem belum lengkap.");
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
      .select("id,role")
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

    const profileUpdate = currentProfile
      ? supabaseAdmin
          .from("profiles")
          .update({
            email: user.email ?? null,
            full_name: fullName,
          })
          .eq("id", user.id)
      : Promise.resolve({ error: null });

    const [{ error: authError }, { error: profileError }] = await Promise.all([
      supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: metadata,
      }),
      profileUpdate,
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

export async function updateOwnPassword(
  passwordInput: string,
  confirmationInput: string,
): Promise<UpdateProfileResult> {
  if (!hasValidSupabaseConfig()) {
    return failure("Konfigurasi sistem belum lengkap.");
  }

  const password = passwordInput.trim();
  const confirmation = confirmationInput.trim();

  if (password.length < 8) return failure("Password minimal 8 karakter.");
  if (password !== confirmation) return failure("Konfirmasi password tidak sama.");

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return failure("Sesi login tidak ditemukan.");
    }

    const { error } = await createSupabaseAdminClient().auth.admin.updateUserById(
      user.id,
      { password },
    );

    if (error) return failure(error.message);

    return { ok: true, message: "Password berhasil diperbarui." };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Gagal memperbarui password.");
  }
}

function failure(message: string): UpdateProfileResult {
  return { ok: false, message };
}
