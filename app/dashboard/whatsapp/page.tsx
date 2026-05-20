"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { whatsappSubmissions } from "@/lib/mock-data";

export default function WhatsappSimulationPage() {
  const [message, setMessage] = useState("Buku#Statistika Pendidikan#Sugiyono#2020#4");
  const parsed = useMemo(() => parseMessage(message), [message]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Input WhatsApp"
        title="Input Koleksi via Pesan"
        description="Validasi format pesan buku dan skripsi sebelum masuk antrean verifikasi."
      />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Uji Format Pesan" description="Coba format input buku atau skripsi.">
            <div className="rounded-2xl border bg-slate-50 p-4 text-sm">
              <p className="font-medium">Contoh format</p>
              <p className="mt-1 text-muted-foreground">Buku#Judul#Penulis#Tahun#Stok</p>
              <p className="text-muted-foreground">Skripsi#Judul#Penulis#Tahun</p>
            </div>
            <Textarea className="mt-4 min-h-28 rounded-2xl" value={message} onChange={(event) => setMessage(event.target.value)} />
            <div className="mt-4 rounded-2xl border p-4 text-sm">
              <p><span className="font-medium">Tipe:</span> {parsed.type}</p>
              <p><span className="font-medium">Status:</span> {parsed.valid ? "Valid" : "Tidak valid"}</p>
              <p className="mt-2 text-muted-foreground">{parsed.response}</p>
            </div>
            <Button
              className="mt-4 w-full rounded-xl"
              disabled={!parsed.valid}
              onClick={() => toast.success("Pesan diterima", { description: parsed.response })}
            >
              <Send />
              Kirim pesan
            </Button>
        </SectionCard>
        <SectionCard title="Riwayat Input" description="Pesan yang telah diproses melalui alur WhatsApp.">
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Pengirim</TableHead>
                  <TableHead>Pesan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whatsappSubmissions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.sender}</TableCell>
                    <TableCell className="max-w-md">{item.message}</TableCell>
                    <TableCell><Badge variant="secondary" className="rounded-full">{item.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </SectionCard>
      </div>
    </div>
  );
}

function parseMessage(value: string) {
  const parts = value.split("#").map((part) => part.trim()).filter(Boolean);
  const type = parts[0]?.toLowerCase();
  if (type === "buku" && parts.length >= 5) {
    return {
      type: "Buku",
      valid: true,
      response: `${parts[1]} oleh ${parts[2]} masuk antrean verifikasi.`,
    };
  }
  if (type === "skripsi" && parts.length >= 4) {
    return {
      type: "Skripsi",
      valid: true,
      response: `Skripsi ${parts[1]} masuk antrean verifikasi.`,
    };
  }
  return {
    type: "Tidak valid",
    valid: false,
    response: "Format belum sesuai. Gunakan Buku#Judul#Penulis#Tahun#Stok atau Skripsi#Judul#Penulis#Tahun.",
  };
}
