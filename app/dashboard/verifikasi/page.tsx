"use client";

import { Check, MessageSquareWarning, X } from "lucide-react";
import { toast } from "sonner";
import { CollectionDetail } from "@/components/collection-detail";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { allCollections } from "@/lib/mock-data";

export default function VerificationPage() {
  const queue = allCollections();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Verifikasi"
        title="Antrean Verifikasi Buku dan Skripsi"
        description="Tinjau koleksi baru, cek metadata, dan tandai status untuk menjaga katalog tetap rapi."
      />
      <SectionCard>
        <Table className="min-w-[780px]">
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Sumber</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="max-w-sm font-medium">{item.title}</TableCell>
                <TableCell>{item.inputSource}</TableCell>
                <TableCell><StatusBadge status={item.verificationStatus} /></TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <CollectionDetail item={item} />
                    <Button variant="outline" size="icon" className="rounded-xl" onClick={() => toast.success("Simulasi: koleksi disetujui")}>
                      <Check />
                      <span className="sr-only">Setujui koleksi</span>
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl" onClick={() => toast.info("Simulasi: koleksi perlu revisi")}>
                      <MessageSquareWarning />
                      <span className="sr-only">Tandai perlu revisi</span>
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl" onClick={() => toast.error("Simulasi: koleksi ditolak")}>
                      <X />
                      <span className="sr-only">Tolak koleksi</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
