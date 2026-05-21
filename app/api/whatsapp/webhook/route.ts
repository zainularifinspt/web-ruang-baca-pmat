import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  normalizePhoneNumber,
  parseWhatsappDraftMessage,
} from "@/lib/whatsapp-drafts";

type IncomingWhatsappMessage = {
  senderPhone: string;
  senderName: string;
  message: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }

  return NextResponse.json({ ok: false, message: "Invalid verification token." }, { status: 403 });
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Payload JSON tidak valid." }, { status: 400 });
  }

  const incomingMessages = extractIncomingMessages(payload);

  if (!incomingMessages.length) {
    return NextResponse.json({ ok: true, message: "Tidak ada pesan WhatsApp yang diproses." });
  }

  const results = await Promise.all(incomingMessages.map(processIncomingMessage));
  const hasRejectedSender = results.some((result) => !result.ok);

  return NextResponse.json(
    {
      ok: !hasRejectedSender,
      results,
    },
    { status: hasRejectedSender ? 403 : 200 },
  );
}

async function processIncomingMessage(incoming: IncomingWhatsappMessage) {
  const senderPhone = normalizePhoneNumber(incoming.senderPhone);

  if (!senderPhone || !incoming.message.trim()) {
    return { ok: false, message: "Nomor pengirim atau pesan tidak valid." };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: petugas, error: petugasError } = await supabaseAdmin
    .from("whatsapp_petugas")
    .select("id,profile_id,nama,phone_number,is_active")
    .eq("phone_number", senderPhone)
    .eq("is_active", true)
    .maybeSingle();

  if (petugasError) {
    return { ok: false, message: petugasError.message };
  }

  if (!petugas) {
    const message = "Nomor WhatsApp belum terdaftar sebagai petugas aktif.";
    await sendWhatsappReply(senderPhone, message);
    return { ok: false, message };
  }

  const parsed = parseWhatsappDraftMessage(incoming.message);
  const { error: insertError } = await supabaseAdmin.from("draft_submissions").insert({
    sender_phone: senderPhone,
    sender_name: incoming.senderName || petugas.nama || null,
    submitted_by: petugas.profile_id ?? null,
    type: parsed.type,
    title: parsed.title || null,
    author: parsed.author || null,
    year: parsed.year,
    category: parsed.category || null,
    description: parsed.formatNote
      ? [parsed.formatNote, parsed.description].filter(Boolean).join("\n\n")
      : parsed.description || null,
    raw_message: incoming.message,
    status: "pending",
  });

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  const responseMessage = parsed.formatNote
    ? `Kiriman diterima, tetapi ${parsed.formatNote}`
    : "Kiriman diterima dan masuk antrean verifikasi admin.";

  await sendWhatsappReply(senderPhone, responseMessage);

  return {
    ok: true,
    message: responseMessage,
    senderPhone,
    type: parsed.type,
  };
}

function extractIncomingMessages(payload: unknown): IncomingWhatsappMessage[] {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;

  const directMessage = extractDirectMessage(record);
  if (directMessage) return [directMessage];

  const entries = Array.isArray(record.entry) ? record.entry : [];
  const messages: IncomingWhatsappMessage[] = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const changes = Array.isArray((entry as Record<string, unknown>).changes)
      ? ((entry as Record<string, unknown>).changes as unknown[])
      : [];

    for (const change of changes) {
      const value = change && typeof change === "object"
        ? (change as Record<string, unknown>).value
        : null;
      if (!value || typeof value !== "object") continue;

      const valueRecord = value as Record<string, unknown>;
      const contacts = Array.isArray(valueRecord.contacts) ? valueRecord.contacts : [];
      const contactByWaId = new Map<string, string>();

      for (const contact of contacts) {
        if (!contact || typeof contact !== "object") continue;
        const contactRecord = contact as Record<string, unknown>;
        const waId = typeof contactRecord.wa_id === "string" ? contactRecord.wa_id : "";
        const profile = contactRecord.profile;
        const name =
          profile && typeof profile === "object" && typeof (profile as Record<string, unknown>).name === "string"
            ? ((profile as Record<string, unknown>).name as string)
            : "";
        if (waId) contactByWaId.set(normalizePhoneNumber(waId), name);
      }

      const cloudMessages = Array.isArray(valueRecord.messages) ? valueRecord.messages : [];
      for (const message of cloudMessages) {
        if (!message || typeof message !== "object") continue;
        const messageRecord = message as Record<string, unknown>;
        const senderPhone = typeof messageRecord.from === "string" ? normalizePhoneNumber(messageRecord.from) : "";
        const text = messageRecord.text;
        const body =
          text && typeof text === "object" && typeof (text as Record<string, unknown>).body === "string"
            ? ((text as Record<string, unknown>).body as string)
            : "";

        if (senderPhone && body) {
          messages.push({
            senderPhone,
            senderName: contactByWaId.get(senderPhone) ?? "",
            message: body,
          });
        }
      }
    }
  }

  return messages;
}

function extractDirectMessage(record: Record<string, unknown>) {
  const senderPhone =
    textRecordValue(record, ["sender_phone", "senderPhone", "from", "phone"]) ?? "";
  const message =
    textRecordValue(record, ["message", "raw_message", "text", "body"]) ?? "";

  if (!senderPhone || !message) return null;

  return {
    senderPhone,
    senderName: textRecordValue(record, ["sender_name", "senderName", "name"]) ?? "",
    message,
  };
}

function textRecordValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  return undefined;
}

async function sendWhatsappReply(to: string, text: string) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) return;

  try {
    await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        text: { body: text },
      }),
    });
  } catch {
    // Webhook persistence should not fail only because outbound reply delivery failed.
  }
}
