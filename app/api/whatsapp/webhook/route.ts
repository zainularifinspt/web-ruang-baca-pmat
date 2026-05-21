import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  normalizePhoneNumber,
  parseWhatsappDraftMessage,
} from "@/lib/whatsapp-drafts";
import { sendWhatsappSubmissionNotification } from "@/lib/whatsapp-notifications";

type IncomingWhatsappTextMessage = {
  senderPhone: string;
  senderName: string;
  body: string;
};

type WhatsappPetugasMatch = {
  profile_id: string | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const verifyToken = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    verifyToken === process.env.WHATSAPP_VERIFY_TOKEN &&
    challenge !== null
  ) {
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    console.error("[whatsapp-webhook] Invalid JSON payload", error);
    return NextResponse.json({ received: false, message: "Invalid JSON payload" }, { status: 400 });
  }

  console.log("[whatsapp-webhook] Payload received", JSON.stringify(payload));

  const messages = extractWhatsappTextMessages(payload);
  console.log(`[whatsapp-webhook] Text messages extracted: ${messages.length}`);

  if (!messages.length) {
    return NextResponse.json({ received: true });
  }

  const results = await Promise.all(messages.map(saveIncomingMessage));
  const failed = results.filter((result) => !result.ok);

  if (failed.length) {
    console.error("[whatsapp-webhook] Some messages failed to persist", failed);
    return NextResponse.json(
      { received: false, saved: results.length - failed.length, failed: failed.length },
      { status: 500 },
    );
  }

  console.log(`[whatsapp-webhook] Messages persisted: ${results.length}`);
  return NextResponse.json({ received: true });
}

function extractWhatsappTextMessages(payload: unknown): IncomingWhatsappTextMessage[] {
  if (!payload || typeof payload !== "object") return [];

  const entries = arrayValue((payload as Record<string, unknown>).entry);
  const messages: IncomingWhatsappTextMessage[] = [];

  for (const entry of entries) {
    const changes = arrayValue(recordValue(entry)?.changes);

    for (const change of changes) {
      const value = recordValue(recordValue(change)?.value);
      if (!value) continue;

      const contacts = arrayValue(value.contacts);
      const contactNamesByPhone = new Map<string, string>();

      for (const contact of contacts) {
        const contactRecord = recordValue(contact);
        if (!contactRecord) continue;

        const phone = normalizePhoneNumber(stringValue(contactRecord.wa_id));
        const profile = recordValue(contactRecord.profile);
        const name = stringValue(profile?.name);

        if (phone) contactNamesByPhone.set(phone, name);
      }

      for (const message of arrayValue(value.messages)) {
        const messageRecord = recordValue(message);
        if (!messageRecord) continue;

        const senderPhone = normalizePhoneNumber(stringValue(messageRecord.from));
        const text = recordValue(messageRecord.text);
        const body = stringValue(text?.body).trim();

        if (!senderPhone || !body) {
          console.log("[whatsapp-webhook] Skipping non-text or incomplete message", {
            hasSender: Boolean(senderPhone),
            messageType: stringValue(messageRecord.type) || "unknown",
          });
          continue;
        }

        messages.push({
          senderPhone,
          senderName: contactNamesByPhone.get(senderPhone) ?? "",
          body,
        });
      }
    }
  }

  return messages;
}

async function saveIncomingMessage(message: IncomingWhatsappTextMessage) {
  const parsed = parseWhatsappDraftMessage(message.body);
  const parsingError = Boolean(parsed.formatNote);
  const supabaseAdmin = createSupabaseAdminClient();
  const petugas = await findWhatsappPetugas(message.senderPhone);
  const unknownSender = !petugas;

  console.log("[whatsapp-webhook] Saving draft submission", {
    senderPhone: message.senderPhone,
    senderName: message.senderName || null,
    type: parsed.type,
    parsingError,
    unknownSender,
  });

  const { error } = await supabaseAdmin.from("draft_submissions").insert({
    sender_phone: message.senderPhone,
    sender_name: message.senderName || null,
    submitted_by: petugas?.profile_id ?? null,
    type: parsed.type,
    title: parsed.title || null,
    author: parsed.author || null,
    year: parsed.year,
    category: parsed.category || null,
    description: parsed.formatNote
      ? [parsed.formatNote, parsed.description].filter(Boolean).join("\n\n")
      : parsed.description || null,
    raw_message: message.body,
    parsing_error: parsingError,
    unknown_sender: unknownSender,
    status: "pending",
  });

  if (error) {
    console.error("[whatsapp-webhook] Failed to save draft submission", {
      senderPhone: message.senderPhone,
      error: error.message,
    });

    return { ok: false, message: error.message };
  }

  console.log("[whatsapp-webhook] Draft submission saved", {
    senderPhone: message.senderPhone,
    type: parsed.type,
    parsingError,
    unknownSender,
  });

  const notificationResult = await sendWhatsappSubmissionNotification({
    senderPhone: message.senderPhone,
    senderName: message.senderName || null,
    type: parsed.type,
    title: parsed.title || null,
    author: parsed.author || null,
    parsingError,
    unknownSender,
  });

  if (!notificationResult.ok) {
    console.error("[whatsapp-webhook] Submission saved but notification failed", {
      senderPhone: message.senderPhone,
      message: notificationResult.message,
    });
  }

  return { ok: true, message: "saved" };
}

async function findWhatsappPetugas(senderPhone: string): Promise<WhatsappPetugasMatch | null> {
  const { data, error } = await createSupabaseAdminClient()
    .from("whatsapp_petugas")
    .select("profile_id")
    .eq("phone_number", senderPhone)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[whatsapp-webhook] Failed to find whatsapp_petugas", {
      senderPhone,
      error: error.message,
    });
    return null;
  }

  return data as WhatsappPetugasMatch | null;
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}
