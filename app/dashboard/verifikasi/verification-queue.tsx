"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { Check, MessageSquareWarning, X } from "lucide-react";
import { toast } from "sonner";
import {
  approveDraftSubmission,
  rejectDraftSubmission,
  updateDraftSubmission,
} from "@/app/admin/submissions/actions";
import { updateCollectionVerificationStatus } from "@/app/dashboard/katalog/actions";
import { CollectionDetail } from "@/components/collection-detail";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DraftSubmissionType } from "@/lib/whatsapp-drafts";
import type { Book, Thesis, VerificationStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type CollectionItem = Book | Thesis;

export type CatalogVerificationItem = {
  kind: "catalog";
  id: string;
  title: string;
  typeLabel: string;
  source: string;
  sender: string;
  status: VerificationStatus;
  createdAt: string;
  item: CollectionItem;
};

export type WhatsappDraftVerificationItem = {
  kind: "whatsapp-draft";
  id: string;
  title: string;
  typeLabel: string;
  source: "WhatsApp";
  sender: string;
  status: VerificationStatus;
  createdAt: string;
  draftType: DraftSubmissionType | null;
  author: string | null;
  year: number | null;
  category: string | null;
  description: string | null;
  rawMessage: string | null;
  parsingError: boolean;
  unknownSender: boolean;
};

export type VerificationQueueItem =
  | CatalogVerificationItem
  | WhatsappDraftVerificationItem;

export function VerificationQueue({ items }: { items: VerificationQueueItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusOverrides, setStatusOverrides] = useState<Record<string, VerificationStatus>>({});

  function updateStatus(item: VerificationQueueItem, status: VerificationStatus) {
    startTransition(async () => {
      const result =
        item.kind === "catalog"
          ? await updateCollectionVerificationStatus(item.item.type, item.item.id, status)
          : status === "approved"
            ? await approveDraftSubmission(item.id)
            : status === "rejected"
              ? await rejectDraftSubmission(item.id)
              : { ok: true, message: "Submission tetap menunggu verifikasi." };

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
    <Table className="min-w-[920px]">
      <TableHeader>
        <TableRow>
          <TableHead>Judul</TableHead>
          <TableHead>Jenis</TableHead>
          <TableHead>Sumber</TableHead>
          <TableHead>Pengirim</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length ? (
          items.map((item) => {
            const currentStatus = statusOverrides[item.id] ?? item.status;

            return (
              <TableRow key={`${item.kind}-${item.id}`}>
                <TableCell className="max-w-xs font-medium">
                  <div>{item.title}</div>
                  <div className="mt-1 text-xs font-normal text-slate-500">
                    {formatDate(item.createdAt)}
                  </div>
                </TableCell>
                <TableCell>{item.typeLabel}</TableCell>
                <TableCell>
                  <div className="font-medium text-slate-800">{item.source}</div>
                </TableCell>
                <TableCell className="max-w-xs text-sm text-slate-600">{item.sender}</TableCell>
                <TableCell>
                  <StatusBadge status={currentStatus} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {item.kind === "catalog" ? (
                      <CollectionDetail
                        item={{ ...item.item, verificationStatus: currentStatus } as CollectionItem}
                      />
                    ) : (
                      <WhatsappDraftDetail item={item} />
                    )}
                    {item.kind === "catalog" ? (
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
                    ) : (
                      <VerifyWhatsappDraftDialog
                        item={item}
                        disabled={isPending || currentStatus === "approved"}
                      />
                    )}
                    {item.kind === "catalog" ? (
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
                    ) : null}
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
            <TableCell colSpan={6} className="py-8">
              <EmptyState
                title="Tidak ada antrean verifikasi"
                description="Buku dan skripsi yang sudah ditinjau tidak akan muncul sebagai antrean baru."
                className="border-slate-200 bg-slate-50/70"
              />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function WhatsappDraftDetail({ item }: { item: WhatsappDraftVerificationItem }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          Detail
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>{item.title}</DialogTitle>
          <DialogDescription>
            Kiriman ini berasal dari WhatsApp dan menunggu verifikasi admin.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <p><span className="font-semibold">Jenis:</span> {item.typeLabel}</p>
            <p><span className="font-semibold">Penulis:</span> {item.author || "-"}</p>
            <p><span className="font-semibold">Tahun:</span> {item.year || "-"}</p>
            <p><span className="font-semibold">Kategori/topik:</span> {item.category || "-"}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <p><span className="font-semibold">Sumber:</span> WhatsApp</p>
            <p><span className="font-semibold">Pengirim:</span> {item.sender}</p>
            <p><span className="font-semibold">Parsing error:</span> {item.parsingError ? "Ya" : "Tidak"}</p>
            <p><span className="font-semibold">Pengirim baru:</span> {item.unknownSender ? "Ya" : "Tidak"}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Raw message</p>
            <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.rawMessage || "-"}</pre>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deskripsi / abstrak</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.description || "-"}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VerifyWhatsappDraftDialog({
  item,
  disabled,
}: {
  item: WhatsappDraftVerificationItem;
  disabled: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({
    title: item.title === "Judul belum terbaca" ? "" : item.title,
    author: item.author ?? "",
    year: item.year ? String(item.year) : "",
    category: item.category ?? "",
    description: item.description ?? "",
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const updateResult = await updateDraftSubmission({
        id: item.id,
        ...values,
      });

      if (!updateResult.ok) {
        toast.error("Gagal menyimpan perubahan", { description: updateResult.message });
        return;
      }

      const approveResult = await approveDraftSubmission(item.id);

      if (!approveResult.ok) {
        toast.error("Gagal verifikasi", { description: approveResult.message });
        return;
      }

      toast.success("Kiriman diverifikasi", { description: approveResult.message });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl text-emerald-700 hover:text-emerald-800"
          disabled={disabled || isPending}
        >
          <Check />
          <span className="sr-only">Buka verifikasi kiriman WhatsApp</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Verifikasi kiriman WhatsApp</DialogTitle>
          <DialogDescription>
            Cek dan perbaiki data sebelum masuk ke katalog publik.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 lg:grid-cols-2">
            <p><span className="font-semibold">Jenis:</span> {item.typeLabel}</p>
            <p><span className="font-semibold">Sumber:</span> WhatsApp</p>
            <p className="lg:col-span-2"><span className="font-semibold">Pengirim:</span> {item.sender}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Judul" className="sm:col-span-2">
              <Input
                value={values.title}
                onChange={(event) => setValues({ ...values, title: event.target.value })}
                required
              />
            </Field>
            <Field label={item.draftType === "thesis" ? "Nama mahasiswa / penulis" : "Penulis"}>
              <Input
                value={values.author}
                onChange={(event) => setValues({ ...values, author: event.target.value })}
                required
              />
            </Field>
            <Field label="Tahun">
              <Input
                value={values.year}
                onChange={(event) => setValues({ ...values, year: event.target.value })}
                required={item.draftType === "thesis"}
              />
            </Field>
            <Field label={item.draftType === "thesis" ? "Topik / kategori" : "Kategori"} className="sm:col-span-2">
              <Input
                value={values.category}
                onChange={(event) => setValues({ ...values, category: event.target.value })}
                required={item.draftType !== "thesis"}
              />
            </Field>
            <Field label={item.draftType === "thesis" ? "Abstrak / deskripsi" : "Deskripsi"} className="sm:col-span-2">
              <Textarea
                value={values.description}
                onChange={(event) => setValues({ ...values, description: event.target.value })}
                className="min-h-28"
                required={item.draftType === "thesis"}
              />
            </Field>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Raw message</p>
            <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.rawMessage || "-"}</pre>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              <Check />
              {isPending ? "Memverifikasi..." : "Verifikasi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
