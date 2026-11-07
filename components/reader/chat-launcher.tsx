"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { MessageCircle, X } from "lucide-react";
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
export function ChatLauncher() {
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
          aria-label={open ? "Tutup chatbot Tama" : "Buka chatbot Tama"}
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
            {open ? (
              <X size={14} aria-hidden="true" />
            ) : (
              <MessageCircle size={14} aria-hidden="true" />
            )}
            {open ? "Tutup" : "Tanya Tama"}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent
        className="catalog-chat-dialog left-auto top-auto translate-x-0 translate-y-0"
        hideCloseButton
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
        {open && <ChatPanel />}
      </DialogContent>
    </Dialog>
  );
}
