import {
  normalizePhoneNumber,
  type DraftSubmissionType,
} from "@/lib/whatsapp-drafts";

type SubmissionNotificationInput = {
  senderPhone: string;
  senderName: string | null;
  type: DraftSubmissionType | null;
  title: string | null;
  author: string | null;
  parsingError: boolean;
  unknownSender: boolean;
};

type WhatsappConfig = {
  to: string;
  phoneNumberId: string;
  accessToken: string;
};

export async function sendWhatsappSubmissionNotification(
  input: SubmissionNotificationInput,
) {
  const config = getWhatsappConfig();

  if (!config) {
    return { ok: false, message: "Konfigurasi WhatsApp belum lengkap." };
  }

  const body = buildSubmissionNotificationMessage(input);
  const response = await fetch(
    `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: config.to,
        type: "text",
        text: { body },
      }),
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    console.error("[whatsapp-notification] WhatsApp API request failed", {
      status: response.status,
      statusText: response.statusText,
      response: responseText.slice(0, 1000),
    });

    return {
      ok: false,
      message: `WhatsApp API request failed with status ${response.status}.`,
    };
  }

  console.log("[whatsapp-notification] Submission notification sent", {
    to: config.to,
    senderPhone: input.senderPhone,
    type: input.type,
  });

  return { ok: true, message: "Notifikasi WhatsApp terkirim." };
}

function getWhatsappConfig(): WhatsappConfig | null {
  const toNumber = process.env.WHATSAPP_TO_NUMBER?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();

  if (!toNumber) {
    console.error("[whatsapp-notification] WHATSAPP_TO_NUMBER kosong.");
  }

  if (!phoneNumberId) {
    console.error("[whatsapp-notification] WHATSAPP_PHONE_NUMBER_ID kosong.");
  }

  if (!accessToken) {
    console.error("[whatsapp-notification] WHATSAPP_ACCESS_TOKEN kosong.");
  }

  if (!toNumber || !phoneNumberId || !accessToken) {
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

  return {
    to: normalizedToNumber,
    phoneNumberId,
    accessToken,
  };
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
