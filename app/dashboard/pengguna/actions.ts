"use server";

import { revalidatePath } from "next/cache";
import { requireStaffRole } from "@/lib/auth-guards";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Role } from "@/lib/types";

export type ManagedUserRole = Extract<Role, "dosen" | "mahasiswa" | "petugas">;

export type SaveUserInput = {
  userId?: string;
  fullName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  nimNip: string;
  phoneNumber: string;
  role: ManagedUserRole;
};

export type SaveUserResult = {
  ok: boolean;
  message: string;
};

const managedRoles: ManagedUserRole[] = ["dosen", "mahasiswa", "petugas"];

export async function saveManagedUser(input: SaveUserInput): Promise<SaveUserResult> {
  const auth = await requireStaffRole(["admin"]);
  if (!auth.ok) return failure(auth.message);

  const userId = input.userId?.trim();
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password ?? "";
  const confirmPassword = input.confirmPassword ?? "";
  const nimNip = input.nimNip.trim();
  const phoneNumber = input.phoneNumber.trim();
  const role = input.role;
  const isEditing = Boolean(userId);

  if (fullName.length < 3) return failure("Nama minimal 3 karakter.");
  if (!email.includes("@")) return failure("Email tidak valid.");
  if (!managedRoles.includes(role)) return failure("Role pengguna tidak valid.");
  if (!nimNip) return failure("NIM/NIP wajib diisi.");
  if (!phoneNumber) return failure("No. WhatsApp wajib diisi.");
  if (!isEditing && password.length < 6) return failure("Password minimal 6 karakter.");
  if (password && password.length < 6) return failure("Password minimal 6 karakter.");
  if (password !== confirmPassword) return failure("Konfirmasi password tidak sama.");

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: existingUsers, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (listError) return failure(listError.message);

    const existingUser = existingUsers.users.find((user) =>
      userId ? user.id === userId : user.email?.toLowerCase() === email,
    );

    const metadata = {
      ...(existingUser?.user_metadata ?? {}),
      full_name: fullName,
      nim_nip: nimNip,
      phone_number: phoneNumber,
    };

    const updatePayload = {
      email,
      email_confirm: true,
      user_metadata: metadata,
      ...(password ? { password } : {}),
    };

    const { user, createUserError } = existingUser
      ? { user: existingUser, createUserError: null }
      : await supabaseAdmin.auth.admin
          .createUser({
            ...updatePayload,
            password,
          })
          .then(({ data, error }) => ({
            user: data.user,
            createUserError: error,
          }));

    if (createUserError || !user) {
      return failure(createUserError?.message ?? "Gagal membuat akun pengguna.");
    }

    const { data: currentProfile, error: currentProfileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (currentProfileError) return failure(currentProfileError.message);
    if (currentProfile?.role === "admin") {
      return failure("Akun admin tidak dapat diubah melalui form pengguna umum.");
    }

    if (existingUser) {
      const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        updatePayload,
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
          role,
        },
        { onConflict: "id" },
      );

    if (profileError) return failure(profileError.message);

    revalidatePath("/dashboard/pengguna");
    revalidatePath("/admin/petugas");

    return success(isEditing ? "Data pengguna berhasil diperbarui." : "Pengguna berhasil ditambahkan.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Gagal menyimpan pengguna.");
  }
}

function success(message: string): SaveUserResult {
  return { ok: true, message };
}

function failure(message: string): SaveUserResult {
  return { ok: false, message };
}
