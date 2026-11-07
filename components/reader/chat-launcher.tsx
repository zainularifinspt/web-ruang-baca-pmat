"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { MessageCircle, X } from "lucide-react";
import type { ReaderManifest } from "@/lib/reader/types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
const ChatPanel = dynamic(
  () => import("./chat-panel").then((m) => m.ChatPanel),
  {
    loading: () => (
      <p className="p-6 text-sm text-slate-600" role="status">
        Menyiapkan asisten…
      </p>
    ),
    ssr: false,
  },
);
export function ChatLauncher({
  thesisId,
  portalContainer,
}: {
  thesisId?: string;
  portalContainer?: HTMLElement;
} = {}) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        <button
          className="catalog-chat-launcher"
          type="button"
          aria-label="Buka chatbot Tama"
          hidden={open}
          data-paused={hidden || open ? "true" : undefined}
        >
          <span className="tama-launcher-figure" aria-hidden="true">
            <Image
              src="/mascots/tama-chat.png"
              alt=""
              width={112}
              height={103}
              sizes="112px"
              className="tama-launcher-image"
            />
          </span>
          <span className="tama-launcher-label">
            <MessageCircle size={14} aria-hidden="true" />
            Tanya Tama
          </span>
        </button>
      </DialogTrigger>
      <DialogContent
        className="catalog-chat-dialog left-auto top-auto translate-x-0 translate-y-0"
        hideCloseButton
        portalContainer={portalContainer}
        onInteractOutside={(event) => event.preventDefault()}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          close.current?.focus({ preventScroll: true });
        }}
      >
        <div className="tama-chat-header">
          <Image
            src="/mascots/tama-chat.png"
            alt=""
            width={56}
            height={51}
            sizes="56px"
            className="tama-chat-avatar"
          />
          <div>
            <DialogTitle>Tama</DialogTitle>
            <p>Asisten Ruang Baca</p>
          </div>
          <DialogClose asChild>
            <button
              ref={close}
              type="button"
              className="tama-chat-close"
              aria-label="Tutup percakapan Tama"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </DialogClose>
        </div>
        {open && (thesisId ? <ThesisChat key={thesisId} id={thesisId} /> : <ChatPanel />)}
      </DialogContent>
    </Dialog>
  );
}

function ThesisChat({ id }: { id: string }) {
  const [revision, setRevision] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function load() {
      try {
        const response = await fetch(`/api/reader/thesis/${encodeURIComponent(id)}`, { signal });
        if (signal.aborted) return;
        if (response.status === 404) {
          setMessage("Teks skripsi ini belum disiapkan untuk Tama. PDF tetap bisa dibaca.");
          return;
        }
        if (!response.ok) throw new Error("Indeks skripsi belum dapat dimuat.");
        const manifest: ReaderManifest = await response.json();
        if (signal.aborted) return;
        if (manifest.searchReady) setRevision(manifest.revision);
        else setMessage("Skripsi ini belum memiliki teks yang dapat ditelusuri Tama.");
      } catch {
        if (!signal.aborted) {
          setMessage("Tama belum dapat memuat skripsi ini. Tutup panel lalu coba lagi.");
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [id]);

  if (revision) {
    return <ChatPanel title="Tanya skripsi ini" scope={{ kind: "thesis", id, revision }} />;
  }

  return (
    <div className="reader-panel-intro">
      <h2>Tanya skripsi ini</h2>
      <p role="status">{message || "Menyiapkan sumber skripsi…"}</p>
    </div>
  );
}
