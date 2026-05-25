import { normalizePhoneNumber } from "@/lib/whatsapp-drafts";

type LoanWhatsappInput = {
  phone: string;
  borrowerName: string;
  itemTitle: string;
  dueDate: string;
};

type WhatsappSendResult = {
  ok: boolean;
  message: string;
};

type WhatsappConfig = {
  baseUrl: string;
  deviceId: string | null;
  username: string | null;
  password: string | null;
};

type WhatsappConfigResult =
  | { ok: true; config: WhatsappConfig }
  | { ok: false; message: string };

export async function sendLoanSuccessNotification(input: LoanWhatsappInput) {
  return sendLoanWhatsappMessage(input, buildLoanSuccessMessage(input));
}

export async function sendLoanReminderH1(input: LoanWhatsappInput) {
  return sendLoanWhatsappMessage(input, buildLoanReminderH1Message(input));
}

export async function sendLoanDueTodayReminder(input: LoanWhatsappInput) {
  return sendLoanWhatsappMessage(input, buildLoanDueTodayMessage(input));
}

export async function sendWhatsappTextMessage({
  phone,
  message,
}: {
  phone: string;
  message: string;
}): Promise<WhatsappSendResult> {
  const configResult = getWhatsappConfig();
  const normalizedPhone = normalizePhoneNumber(phone);

  if (!configResult.ok) {
    return { ok: false, message: configResult.message };
  }

  const { config } = configResult;

  if (!isValidWhatsappNumber(normalizedPhone)) {
    console.error("[whatsapp] Nomor tujuan tidak valid", {
      phoneLength: normalizedPhone.length,
    });
    return { ok: false, message: "Nomor WhatsApp tujuan tidak valid." };
  }

  const response = await fetch(`${config.baseUrl}/send/message`, {
    method: "POST",
    headers: buildWhatsappHeaders(config),
    body: JSON.stringify({
      phone: normalizedPhone,
      message,
      is_forwarded: false,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    console.error("[whatsapp] GOWA API request failed", {
      status: response.status,
      statusText: response.statusText,
      response: responseText.slice(0, 1000),
    });
    return {
      ok: false,
      message: `WhatsApp API request failed with status ${response.status}.`,
    };
  }

  console.log("[whatsapp] WhatsApp text message sent", {
    to: normalizedPhone,
    deviceId: config.deviceId,
  });

  return { ok: true, message: "Notifikasi WhatsApp terkirim." };
}

async function sendLoanWhatsappMessage(
  input: LoanWhatsappInput,
  textBody: string,
): Promise<WhatsappSendResult> {
  return sendWhatsappTextMessage({
    phone: input.phone,
    message: textBody,
  });
}

function getWhatsappConfig(): WhatsappConfigResult {
  const baseUrl = process.env.WHATSAPP_API_BASE_URL?.trim().replace(/\/+$/, "");
  const deviceId = process.env.WHATSAPP_DEVICE_ID?.trim() || null;
  const username = process.env.WHATSAPP_API_USERNAME?.trim() || null;
  const password = process.env.WHATSAPP_API_PASSWORD?.trim() || null;
  const missingFields: string[] = [];

  if (!baseUrl) {
    missingFields.push("WHATSAPP_API_BASE_URL");
    console.error("[whatsapp] WHATSAPP_API_BASE_URL kosong.");
  }

  if ((username && !password) || (!username && password)) {
    console.error(
      "[whatsapp] WHATSAPP_API_USERNAME dan WHATSAPP_API_PASSWORD harus diisi bersamaan.",
    );
    return {
      ok: false,
      message:
        "WHATSAPP_API_USERNAME dan WHATSAPP_API_PASSWORD harus diisi bersamaan atau sama-sama dikosongkan.",
    };
  }

  if (missingFields.length) {
    return {
      ok: false,
      message: `Konfigurasi WhatsApp API belum lengkap. Variabel kosong: ${missingFields.join(", ")}.`,
    };
  }

  if (!baseUrl) {
    return {
      ok: false,
      message: "Konfigurasi WhatsApp API belum lengkap. Variabel kosong: WHATSAPP_API_BASE_URL.",
    };
  }

  return { ok: true, config: { baseUrl, deviceId, username, password } };
}

function buildWhatsappHeaders(config: WhatsappConfig) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.deviceId) {
    headers["X-Device-Id"] = config.deviceId;
  }

  if (config.username && config.password) {
    headers.Authorization = `Basic ${Buffer.from(
      `${config.username}:${config.password}`,
    ).toString("base64")}`;
  }

  return headers;
}

function buildLoanSuccessMessage(input: LoanWhatsappInput) {
  return `Halo ${input.borrowerName}, peminjaman ${input.itemTitle} di Ruang Baca Pendidikan Matematika berhasil dicatat. Koleksi tersebut harus dikembalikan paling lambat tanggal ${formatDisplayDate(input.dueDate)}. Terima kasih.`;
}

function buildLoanReminderH1Message(input: LoanWhatsappInput) {
  return `Halo ${input.borrowerName}, ini pengingat bahwa koleksi ${input.itemTitle} yang Anda pinjam dari Ruang Baca Pendidikan Matematika harus dikembalikan besok, tanggal ${formatDisplayDate(input.dueDate)}. Terima kasih.`;
}

function buildLoanDueTodayMessage(input: LoanWhatsappInput) {
  return `Halo ${input.borrowerName}, koleksi ${input.itemTitle} yang Anda pinjam dari Ruang Baca Pendidikan Matematika dijadwalkan kembali hari ini, tanggal ${formatDisplayDate(input.dueDate)}. Mohon segera dikembalikan ke petugas ruang baca. Terima kasih.`;
}

function isValidWhatsappNumber(value: string) {
  return /^62\d{8,15}$/.test(value);
}

function formatDisplayDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  }).format(new Date(`${date}T00:00:00+08:00`));
}
