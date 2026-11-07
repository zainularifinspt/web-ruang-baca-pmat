import { NextRequest, NextResponse } from "next/server";
import { fetchPublicCatalogData } from "@/lib/public-cache";
import {
  normalizeText,
  queryTerms,
  readerUrl,
  hasVerifiedCatalogSource,
} from "@/lib/reader/core";
import { getReaderDocument, retrieveSources } from "@/lib/reader/store";
import { embedQuestion } from "@/lib/reader/embedding";
import { chatSession, reserveChat } from "@/lib/reader/quota";
import { answerWithDeepseek, reservedCost } from "@/lib/reader/chat";
import type { ChatResult, ReaderSource } from "@/lib/reader/types";
export const runtime = "nodejs";
export const maxDuration = 60;
const notFound: ChatResult = {
  paragraphs: [
    "Saya belum menemukan bukti yang cukup dalam koleksi Ruang Baca yang dapat diakses. Coba sebutkan judul dokumen atau gunakan kata kunci yang lebih spesifik.",
  ],
  sources: [],
  status: "not_found",
};
async function bodyJson(request: Request) {
  if (!request.body) throw Error("Pertanyaan belum diisi.");
  const reader = request.body.getReader();
  let size = 0;
  let text = "";
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16000) {
      await reader.cancel();
      throw Error("Pesan terlalu panjang.");
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return JSON.parse(text);
}
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin)
    return NextResponse.json(
      { error: "Permintaan tidak diizinkan." },
      { status: 403 },
    );
  let session: { id: string; cookie: string } | undefined;
  const reply = (data: unknown, status = 200) => {
    const r = NextResponse.json(data, {
      status,
      headers: { "Cache-Control": "private, no-store" },
    });
    if (session)
      r.cookies.set("rb-chat", session.cookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 86400,
      });
    return r;
  };
  try {
    if (!request.headers.get("content-type")?.includes("application/json"))
      return reply({ error: "Format pesan tidak didukung." }, 415);
    let body;
    try {
      body = await bodyJson(request);
    } catch {
      return reply({ error: "Pesan tidak valid atau terlalu panjang." }, 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body))
      return reply({ error: "Pesan tidak valid." }, 400);
    const question =
      typeof body.message === "string" ? body.message.trim() : "";
    if (question.length < 2 || question.length > 1200)
      return reply({ error: "Gunakan pertanyaan 2–1.200 karakter." }, 400);
    const history = Array.isArray(body.history)
      ? body.history
          .slice(-4)
          .filter(
            (h: unknown) =>
              h &&
              typeof h === "object" &&
              ["user", "assistant"].includes((h as { role: string }).role) &&
              typeof (h as { content: unknown }).content === "string",
          )
          .map((h: { role: string; content: string }) => ({
            role: h.role,
            content: h.content.slice(0, 800),
          }))
      : [];
    session = await chatSession(request.cookies.get("rb-chat")?.value);
    const network =
      process.env.VERCEL === "1"
        ? request.headers
            .get("x-vercel-forwarded-for")
            ?.split(",")[0]
            ?.trim() || null
        : process.env.READER_TRUST_PROXY_HEADERS === "true"
          ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            null
          : null;
    // Every request consumes a request quota, including metadata queries and refusals.
    const requestQuota = await reserveChat(session.id, network, 0);
    if (!requestQuota.ok)
      return reply(
        {
          error:
            "Batas pertanyaan tercapai. Silakan coba kembali nanti; katalog dan pencarian isi tetap tersedia.",
        },
        429,
      );
    const scope = body.scope;
    let doc = null;
    if (scope) {
      if (
        typeof scope !== "object" ||
        Array.isArray(scope) ||
        !["book", "thesis"].includes(scope.kind) ||
        typeof scope.id !== "string"
      )
        return reply({ error: "Konteks dokumen tidak valid." }, 400);
      doc = await getReaderDocument(scope.kind, scope.id);
      if (!doc || doc.revision !== scope.revision)
        return reply(
          {
            error: "Dokumen belum siap atau sudah berubah. Buka ulang pembaca.",
          },
          409,
        );
      if (
        scope.page !== undefined &&
        (!Number.isInteger(scope.page) ||
          !doc.pages.some((p) => p.number === scope.page))
      )
        return reply(
          { error: "Halaman tidak tersedia untuk pertanyaan ini." },
          400,
        );
    }
    if (
      !scope &&
      /\b(cari|carikan|buku|skripsi|koleksi|judul|rekomendasi)\b/i.test(
        question,
      )
    ) {
      const { books, theses, error } = await fetchPublicCatalogData();
      if (error) return reply({ error: "Katalog belum dapat dimuat." }, 503);
      const terms = queryTerms(question);
      const kind =
        /\bskripsi\b/i.test(question) && !/\bbuku\b/i.test(question)
          ? "thesis"
          : /\bbuku\b/i.test(question) && !/\bskripsi\b/i.test(question)
            ? "book"
            : null;
      const matches = [...books, ...theses]
        .filter(
          (i) =>
            (i.type !== "book" || hasVerifiedCatalogSource(i)) &&
            (!kind || i.type === kind),
        )
        .map((i) => {
          const metadata = [
            i.title,
            i.type === "book" ? i.author : i.studentName,
            i.type === "book" ? i.category : i.topic,
            ...i.keywords,
          ].join(" ");
          const hay = normalizeText(metadata);
          return {
            i,
            metadata,
            score:
              terms.filter((t) => hay.includes(t)).length /
              Math.max(1, terms.length),
          };
        })
        .filter((m) => m.score >= 0.5)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      if (matches.length)
        return reply({
          paragraphs: [
            "Berikut koleksi yang cocok dengan kata kunci Anda. Pilih sumber untuk melihat detail dan membacanya.",
          ],
          sources: matches.map(({ i, metadata }, n) => ({
            id: `catalog-${n}`,
            title: i.title,
            author: i.type === "book" ? i.author : i.studentName,
            url:
              i.type === "book" && i.pdfUrl
                ? readerUrl("book", i.id)
                : `/katalog/${i.type === "book" ? "buku" : "skripsi"}/${encodeURIComponent(i.id)}`,
            excerpt: metadata.slice(0, 240),
          })),
          status: "answered",
          remaining: requestQuota.remaining,
        });
    }
    const embedding = await embedQuestion(question);
    let sources: ReaderSource[] = [];
    try {
      sources = await retrieveSources(question, doc, embedding, scope?.page);
    } catch {
      return reply(
        {
          error: "Indeks sumber belum siap. Silakan gunakan katalog sementara.",
        },
        503,
      );
    }
    if (!sources.length)
      return reply({ ...notFound, remaining: requestQuota.remaining });
    if (!process.env.DEEPSEEK_API_KEY)
      return reply(
        {
          error:
            "Asisten AI belum diaktifkan. Pencarian koleksi, pencarian isi, dan pembaca tetap dapat digunakan.",
        },
        503,
      );
    // Reserve only the global cost here; request quota was already consumed.
    const budget = await reserveChatBudget(
      reservedCost(question, sources, history),
    );
    if (!budget)
      return reply(
        {
          error:
            "Kuota layanan AI hari ini telah tercapai. Pembaca dan pencarian isi tetap tersedia.",
        },
        429,
      );
    const answer = await answerWithDeepseek(question, sources, history);
    return reply(
      answer
        ? { ...answer, status: "answered", remaining: requestQuota.remaining }
        : { ...notFound, remaining: requestQuota.remaining },
    );
  } catch (error) {
    return reply(
      {
        error:
          error instanceof Error ? error.message : "Layanan belum tersedia.",
      },
      503,
    );
  }
}
// Kept separate so a budget reservation cannot charge the visitor twice.
import { reserveChatBudget } from "@/lib/reader/quota";
