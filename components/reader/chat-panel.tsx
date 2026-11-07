"use client";
import { useState, useRef, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowUp,
  BookOpen,
  MessageCircle,
  RotateCcw,
} from "lucide-react";
import type { ChatResult } from "@/lib/reader/types";
type Scope = {
  kind: "book" | "thesis";
  id: string;
  revision: string;
  page?: number;
};
type Message = {
  role: "user" | "assistant";
  content: string;
  answer?: ChatResult;
  error?: boolean;
};
export function ChatPanel({
  scope,
  onSource,
  compact = false,
  title = "Tanya Ruang Baca",
}: {
  scope?: Scope;
  onSource?: (url: string) => void;
  compact?: boolean;
  title?: string;
}) {
  const documentName = scope?.kind === "thesis" ? "skripsi" : "buku";
  const scopedExample = scope?.page
    ? "Apa inti pembahasan di halaman ini?"
    : `Apa topik utama ${documentName} ini?`;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const messagesBox = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);
  const key = scope
    ? `${scope.kind}:${scope.id}:${scope.revision}:${scope.page || "book"}`
    : "catalog";
  useEffect(() => () => controller.current?.abort(), [key]);
  useEffect(() => {
    const box = messagesBox.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages, busy]);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (question.length < 2 || busy) return;
    const history = messages
      .slice(-4)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setBusy(true);
    controller.current = new AbortController();
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, scope, history }),
        signal: controller.current.signal,
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(data.error || "Jawaban belum dapat dimuat.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.paragraphs.join("\n\n"),
          answer: data,
        },
      ]);
      if (typeof data.remaining === "number") setRemaining(data.remaining);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              error instanceof Error
                ? error.message
                : "Layanan belum tersedia.",
            error: true,
          },
        ]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="reader-chat">
      {!compact && (
        <div className="reader-panel-intro">
          <div className="reader-panel-symbol">
            <MessageCircle size={19} />
          </div>
          <h2>{title}</h2>
          <p>
            {scope?.page
              ? `Bertanya tentang halaman PDF ${scope.page}.`
              : scope
                ? `Jawaban dari bagian ${documentName} yang dapat dibaca.`
                : "Temukan koleksi dan jawaban dari sumber Ruang Baca."}
          </p>
        </div>
      )}
      <div
        className="reader-messages"
        ref={messagesBox}
        aria-live="polite"
        aria-relevant="additions text"
      >
        {!messages.length && (
          <div className={`reader-chat-empty${compact ? " is-compact" : ""}`}>
            {compact ? <MessageCircle size={24} /> : <BookOpen size={28} />}
            <p>{compact ? "Coba tanyakan" : "Mulai dari rasa ingin tahu."}</p>
            <span>
              {compact
                ? `“${scopedExample}”`
                : scope
                  ? "Coba “Apa pembahasan utama bagian ini?”"
                  : "Coba “Cari buku tentang statistika”."}
            </span>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`reader-message ${m.role === "user" ? "from-user" : "from-assistant"} ${m.error ? "is-error" : ""}`}
          >
            <span className="reader-message-author">
              {m.role === "user" ? "Anda" : "Asisten Ruang Baca"}
            </span>
            {m.content.split("\n\n").map((p, j) => (
              <p key={j}>{p}</p>
            ))}
            {m.answer?.sources.map((source) => (
              <a
                key={source.id}
                href={source.url}
                className="reader-source"
                onClick={
                  onSource
                    ? (e) => {
                        e.preventDefault();
                        onSource(source.url);
                      }
                    : undefined
                }
              >
                <BookOpen size={15} />
                <span>
                  <strong>{source.title}</strong>
                  <small>
                    {source.page
                      ? `Halaman ${source.label || source.page} · PDF ${source.page}`
                      : source.author}
                  </small>
                </span>
                <ArrowUpRight size={15} />
              </a>
            ))}
          </div>
        ))}
        {busy && (
          <div className="reader-thinking" role="status">
            <span />
            <span />
            <span />
            Menelusuri sumber…
          </div>
        )}
      </div>
      <form onSubmit={send} className="reader-chat-form">
        <label htmlFor={`chat-${key}`} className="sr-only">
          Pertanyaan
        </label>
        <textarea
          id={`chat-${key}`}
          maxLength={1200}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing)
              return;
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }}
          enterKeyHint="send"
          placeholder={
            scope?.page
              ? "Tanyakan isi halaman ini…"
              : scope
                ? `Tanyakan isi ${documentName}…`
                : "Cari koleksi atau tanyakan topik…"
          }
          rows={2}
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || input.trim().length < 2}
          aria-label="Kirim pertanyaan"
          title="Kirim pertanyaan (Enter)"
        >
          <ArrowUp size={18} />
        </button>
      </form>
      {(remaining !== null || messages.length > 0) && (
        <div className="reader-chat-foot">
          {remaining !== null && (
            <span>{remaining} pertanyaan tersisa hari ini</span>
          )}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              disabled={busy}
              aria-label="Hapus percakapan lokal"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
