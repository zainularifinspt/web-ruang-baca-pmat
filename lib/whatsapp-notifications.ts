import {
  normalizePhoneNumber,
  type DraftSubmissionType,
} from "@/lib/whatsapp-drafts";
import { sendWhatsappTextMessage } from "@/lib/whatsapp";

type SubmissionNotificationInput = {
  senderPhone: string;
  senderName: string | null;
  type: DraftSubmissionType | null;
  title: string | null;
  author: string | null;
  parsingError: boolean;
  unknownSender: boolean;
};

export async function sendWhatsappSubmissionNotification(
  input: SubmissionNotificationInput,
) {
  const toNumber = getNotificationTargetNumber();

  if (!toNumber) {
    return { ok: false, message: "Nomor tujuan notifikasi WhatsApp belum valid." };
  }

  const result = await sendWhatsappTextMessage({
    phone: toNumber,
    message: buildSubmissionNotificationMessage(input),
  });

  if (result.ok) {
    console.log("[whatsapp-notification] Submission notification sent", {
      to: toNumber,
      senderPhone: input.senderPhone,
      type: input.type,
    });
  }

  return result;
}

function getNotificationTargetNumber() {
  const toNumber = process.env.WHATSAPP_TO_NUMBER?.trim();

  if (!toNumber) {
    console.error("[whatsapp-notification] WHATSAPP_TO_NUMBER kosong.");
    return null;
  }

  const normalizedToNumber = normalizePhoneNumber(toNumber);
  const hasValidInternationalFormat =
    normalizedToNumber === toNumber &&
    /^\d+$/.test(toNumber) &&
    !toNumber.startsWith("0");

  if (!hasValidInternationalFormat) {
    console.error(
      "[whatsapp-notification] WHATSAPP_TO_NUMBER harus format internasional tanpa tanda plus. Contoh benar: 62895800123388.",
    );
    return null;
  }

  return normalizedToNumber;
}

function buildSubmissionNotificationMessage(input: SubmissionNotificationInput) {
  const typeLabel =
    input.type === "book"
      ? "Buku"
      : input.type === "thesis"
        ? "Skripsi"
        : "Format belum terbaca";
  const senderName = input.senderName?.trim() || "Pengirim WhatsApp";
  const title = input.title?.trim() || "Judul belum terbaca";
  const author = input.author?.trim() || "Penulis belum terbaca";

  return [
    "Notifikasi Ruang Baca",
    "Ada submission WhatsApp baru.",
    "",
    `Tipe: ${typeLabel}`,
    `Judul: ${title}`,
    `Penulis: ${author}`,
    `Pengirim: ${senderName}`,
    `Nomor WA: ${input.senderPhone}`,
    `Status parsing: ${input.parsingError ? "Perlu dicek" : "Berhasil"}`,
    `Pengirim dikenal: ${input.unknownSender ? "Tidak" : "Ya"}`,
    "",
    "Silakan buka dashboard admin untuk verifikasi.",
  ].join("\n");
}
