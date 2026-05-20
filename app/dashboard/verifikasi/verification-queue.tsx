"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, MessageSquareWarning, X } from "lucide-react";
import { toast } from "sonner";
import { updateCollectionVerificationStatus } from "@/app/dashboard/katalog/actions";
import { CollectionDetail } from "@/components/collection-detail";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Book, Thesis, VerificationStatus } from "@/lib/types";

type CollectionItem = Book | Thesis;

export function VerificationQueue({ items }: { items: CollectionItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusOverrides, setStatusOverrides] = useState<Record<string, VerificationStatus>>({});

  function updateStatus(item: CollectionItem, status: VerificationStatus) {
    startTransition(async () => {
      const result = await updateCollectionVerificationStatus(item.type, item.id, status);

      if (!result.ok) {
        toast.error("Gagal memperbarui verifikasi", { description: result.message });
        return;
      }

      toast.success(result.message);
      setStatusOverrides((current) => ({
        ...current,
        [item.id]: status,
      }));
      router.refresh();
    });
  }

  return (
    <Table className="min-w-[840px]">
      <TableHeader>
        <TableRow>
          <TableHead>Judul</TableHead>
          <TableHead>Jenis</TableHead>
          <TableHead>Sumber</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length ? (
          items.map((item) => {
            const currentStatus = statusOverrides[item.id] ?? item.verificationStatus;
            const itemWithStatus = { ...item, verificationStatus: currentStatus } as CollectionItem;

            return (
              <TableRow key={`${item.type}-${item.id}`}>
                <TableCell className="max-w-sm font-medium">{item.title}</TableCell>
                <TableCell>{item.type === "book" ? "Buku" : "Skripsi"}</TableCell>
                <TableCell>{item.inputSource}</TableCell>
                <TableCell>
                  <StatusBadge status={currentStatus} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <CollectionDetail item={itemWithStatus} />
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl text-emerald-700 hover:text-emerald-800"
                      disabled={isPending || currentStatus === "approved"}
                      onClick={() => updateStatus(item, "approved")}
                    >
                      <Check />
                      <span className="sr-only">Setujui koleksi</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl text-amber-700 hover:text-amber-800"
                      disabled={isPending || currentStatus === "pending"}
                      onClick={() => updateStatus(item, "pending")}
                    >
                      <MessageSquareWarning />
                      <span className="sr-only">Tandai menunggu verifikasi</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl text-rose-700 hover:text-rose-800"
                      disabled={isPending || currentStatus === "rejected"}
                      onClick={() => updateStatus(item, "rejected")}
                    >
                      <X />
                      <span className="sr-only">Tolak koleksi</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="h-28 text-center text-sm text-slate-500">
              Belum ada koleksi yang perlu diverifikasi.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
