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

type TemplateConfig = {
  envName: string;
  templateName?: string;
  languageCode: string;
};

type WhatsappConfig = {
  phoneNumberId: string;
  accessToken: string;
};

export async function sendLoanSuccessNotification(input: LoanWhatsappInput) {
  return sendLoanWhatsappMessage(input, {
    envName: "WHATSAPP_TEMPLATE_LOAN_SUCCESS",
    templateName: process.env.WHATSAPP_TEMPLATE_LOAN_SUCCESS?.trim(),
    languageCode: "id",
  }, buildLoanSuccessMessage(input));
}

export async function sendLoanReminderH1(input: LoanWhatsappInput) {
  return sendLoanWhatsappMessage(input, {
    envName: "WHATSAPP_TEMPLATE_LOAN_REMINDER_H1",
    templateName: process.env.WHATSAPP_TEMPLATE_LOAN_REMINDER_H1?.trim(),
    languageCode: "id",
  }, buildLoanReminderH1Message(input));
}

export async function sendLoanDueTodayReminder(input: LoanWhatsappInput) {
  return sendLoanWhatsappMessage(input, {
    envName: "WHATSAPP_TEMPLATE_LOAN_DUE_TODAY",
    templateName: process.env.WHATSAPP_TEMPLATE_LOAN_DUE_TODAY?.trim(),
    languageCode: "id",
  }, buildLoanDueTodayMessage(input));
}

async function sendLoanWhatsappMessage(
  input: LoanWhatsappInput,
  template: TemplateConfig,
  textBody: string,
): Promise<WhatsappSendResult> {
  const config = getWhatsappConfig();
  const normalizedPhone = normalizePhoneNumber(input.phone);

  if (!config) {
    return { ok: false, message: "Konfigurasi WhatsApp belum lengkap." };
  }

  if (!isValidWhatsappNumber(normalizedPhone)) {
    console.error("[whatsapp-loans] Nomor tujuan peminjaman tidak valid", {
      phoneLength: normalizedPhone.length,
    });
    return { ok: false, message: "Nomor WhatsApp peminjam tidak valid." };
  }

  if (!template.templateName) {
    console.warn(`[whatsapp-loans] ${template.envName} kosong. Mengirim pesan teks biasa.`);
  }

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        template.templateName
          ? buildTemplatePayload(normalizedPhone, template, input)
          : buildTextPayload(normalizedPhone, textBody),
      ),
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    console.error("[whatsapp-loans] WhatsApp API request failed", {
      status: response.status,
      statusText: response.statusText,
      response: responseText.slice(0, 1000),
      template: template.templateName || null,
    });
    return {
      ok: false,
      message: `WhatsApp API request failed with status ${response.status}.`,
    };
  }

  console.log("[whatsapp-loans] Loan WhatsApp notification sent", {
    to: normalizedPhone,
    template: template.templateName || "text",
  });

  return { ok: true, message: "Notifikasi WhatsApp terkirim." };
}

function getWhatsappConfig(): WhatsappConfig | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();

  if (!phoneNumberId) {
    console.error("[whatsapp-loans] WHATSAPP_PHONE_NUMBER_ID kosong.");
  }

  if (!accessToken) {
    console.error("[whatsapp-loans] WHATSAPP_ACCESS_TOKEN kosong.");
  }

  if (!phoneNumberId || !accessToken) return null;

  return { phoneNumberId, accessToken };
}

function buildTextPayload(to: string, body: string) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  };
}

function buildTemplatePayload(to: string, template: TemplateConfig, input: LoanWhatsappInput) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: template.templateName,
      language: { code: template.languageCode },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: input.borrowerName },
            { type: "text", text: input.itemTitle },
            { type: "text", text: formatDisplayDate(input.dueDate) },
          ],
        },
      ],
    },
  };
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
