"use server";

import { revalidatePath } from "next/cache";
import { requireStaffRole } from "@/lib/auth-guards";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export type CreatePetugasState = {
  ok: boolean;
  message: string;
};

export type CreatePetugasInput = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export async function createPetugasAccount(
  input: CreatePetugasInput,
): Promise<CreatePetugasState> {
  const auth = await requireStaffRole(["admin"]);
  if (!auth.ok) return failure(auth.message);

  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const confirmPassword = input.confirmPassword;

  if (fullName.length < 3) return failure("Nama petugas minimal 3 karakter.");
  if (!email.includes("@")) return failure("Email petugas tidak valid.");
  if (password.length < 6) return failure("Password minimal 6 karakter.");
  if (password !== confirmPassword) return failure("Konfirmasi password tidak sama.");

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: existingUsers, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) return failure(listError.message);

    const existingUser = existingUsers.users.find(
      (user) => user.email?.toLowerCase() === email,
    );

    const { user, createUserError } = existingUser
      ? { user: existingUser, createUserError: null }
      : await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            app_role: "petugas",
            full_name: fullName,
          },
        }).then(({ data, error }) => ({
          user: data.user,
          createUserError: error,
        }));

    if (createUserError || !user) {
      return failure(createUserError?.message ?? "Gagal membuat akun petugas.");
    }

    if (existingUser) {
      const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          email_confirm: true,
          user_metadata: {
            ...existingUser.user_metadata,
            app_role: "petugas",
            full_name: fullName,
          },
        },
      );

      if (updateUserError) return failure(updateUserError.message);
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email,
          full_name: fullName,
          role: "petugas",
        },
        { onConflict: "id" },
      );

    if (profileError) return failure(profileError.message);

    revalidatePath("/admin/petugas");
    return success("Akun petugas berhasil dibuat.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Gagal membuat akun petugas.");
  }
}

function success(message: string): CreatePetugasState {
  return { ok: true, message };
}

function failure(message: string): CreatePetugasState {
  return { ok: false, message };
}
