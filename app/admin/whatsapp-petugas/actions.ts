"use server";

import { revalidatePath } from "next/cache";
import { requireStaffRole } from "@/lib/auth-guards";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { normalizePhoneNumber } from "@/lib/whatsapp-drafts";

export type WhatsappPetugasInput = {
  id?: string;
  nama: string;
  phoneNumber: string;
  profileId?: string;
};

export type WhatsappPetugasActionResult = {
  ok: boolean;
  message: string;
};

export async function saveWhatsappPetugas(
  input: WhatsappPetugasInput,
): Promise<WhatsappPetugasActionResult> {
  const auth = await requireStaffRole(["admin"]);
  if (!auth.ok) return failure(auth.message);

  const id = input.id?.trim();
  const nama = input.nama.trim();
  const phoneNumber = normalizePhoneNumber(input.phoneNumber);
  const profileId = input.profileId && input.profileId !== "none" ? input.profileId : null;

  if (nama.length < 3) return failure("Nama petugas minimal 3 karakter.");
  if (phoneNumber.length < 9) return failure("Nomor WhatsApp tidak valid.");

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const payload = {
      nama,
      phone_number: phoneNumber,
      profile_id: profileId,
    };

    const { error } = id
      ? await supabaseAdmin.from("whatsapp_petugas").update(payload).eq("id", id)
      : await supabaseAdmin.from("whatsapp_petugas").insert(payload);

    if (error) return failure(error.message);

    revalidatePath("/admin/whatsapp-petugas");
    return { ok: true, message: id ? "Nomor WhatsApp petugas diperbarui." : "Nomor WhatsApp petugas ditambahkan." };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Gagal menyimpan nomor WhatsApp petugas.");
  }
}

export async function setWhatsappPetugasActive(
  id: string,
  isActive: boolean,
): Promise<WhatsappPetugasActionResult> {
  const auth = await requireStaffRole(["admin"]);
  if (!auth.ok) return failure(auth.message);

  if (!id.trim()) return failure("Data petugas tidak valid.");

  try {
    const { error } = await createSupabaseAdminClient()
      .from("whatsapp_petugas")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) return failure(error.message);

    revalidatePath("/admin/whatsapp-petugas");
    return { ok: true, message: isActive ? "Nomor petugas diaktifkan." : "Nomor petugas dinonaktifkan." };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Gagal mengubah status nomor petugas.");
  }
}

function failure(message: string): WhatsappPetugasActionResult {
  return { ok: false, message };
}
