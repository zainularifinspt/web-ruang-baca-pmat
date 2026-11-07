"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
const ChatPanel = dynamic(
  () => import("./chat-panel").then((m) => m.ChatPanel),
  {
    loading: () => (
      <p className="p-6 text-sm text-slate-600">Menyiapkan asisten…</p>
    ),
    ssr: false,
  },
);
export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="catalog-chat-launcher" type="button">
          <MessageCircle size={20} />
          <span>Tanya Ruang Baca</span>
        </button>
      </DialogTrigger>
      <DialogContent className="catalog-chat-dialog">
        <DialogTitle className="sr-only">Tanya Ruang Baca</DialogTitle>
        {open && <ChatPanel />}
      </DialogContent>
    </Dialog>
  );
}
