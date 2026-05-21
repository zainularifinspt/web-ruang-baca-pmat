"use client";

import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle, Eye, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateDraftSubmission } from "@/app/admin/submissions/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DraftSubmissionStatus, DraftSubmissionType } from "@/lib/whatsapp-drafts";
import { formatDate } from "@/lib/utils";

export type SubmissionRow = {
  id: string;
  sender_phone: string | null;
  sender_name: string | null;
  submitted_by: string | null;
  type: DraftSubmissionType | null;
  title: string | null;
  author: string | null;
  year: number | null;
  category: string | null;
  description: string | null;
  raw_message: string | null;
  parsing_error: boolean;
  unknown_sender: boolean;
  status: DraftSubmissionStatus;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
};

export type SenderProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export function SubmissionsManager({
  submissions,
  profilesById,
  petugasByPhone,
}: {
  submissions: SubmissionRow[];
  profilesById: Record<string, SenderProfile>;
  petugasByPhone: Record<string, { nama: string | null; profile_id: string | null }>;
}) {
  if (!submissions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        Belum ada kiriman WhatsApp.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {submissions.map((submission) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          senderName={getSenderName(submission, profilesById, petugasByPhone)}
        />
      ))}
    </div>
  );
}

function SubmissionCard({
  submission,
  senderName,
}: {
  submission: SubmissionRow;
  senderName: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{typeLabel(submission.type)}</Badge>
            <StatusBadge status={submission.status} />
            {submission.parsing_error ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <AlertTriangle className="size-3.5" />
                Format perlu dicek
              </span>
            ) : null}
            {submission.unknown_sender ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                Pengirim baru
              </span>
            ) : null}
            <span className="text-xs text-slate-500">{formatDate(submission.created_at)}</span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">
            {submission.title || "Judul belum terbaca"}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {submission.author || "Penulis belum terbaca"} {submission.year ? `- ${submission.year}` : ""}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Pengirim: <span className="font-medium text-slate-700">{senderName}</span> ({submission.sender_phone || "-"})
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SubmissionDetailDialog submission={submission} senderName={senderName} />
          <EditSubmissionDialog submission={submission} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Raw message</p>
          <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{submission.raw_message || "-"}</pre>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          <p><span className="font-semibold">Kategori/topik:</span> {submission.category || "-"}</p>
          <p className="mt-2"><span className="font-semibold">Deskripsi/abstrak:</span> {submission.description || "-"}</p>
        </div>
      </div>
    </article>
  );
}

function SubmissionDetailDialog({
  submission,
  senderName,
}: {
  submission: SubmissionRow;
  senderName: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="rounded-xl">
          <Eye />
          Detail
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Detail submission WhatsApp</DialogTitle>
          <DialogDescription>
            Data asli dari webhook dan hasil parsing sementara sebelum approve.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <p><span className="font-semibold">Nama pengirim:</span> {senderName}</p>
            <p><span className="font-semibold">Nomor WA:</span> {submission.sender_phone || "-"}</p>
            <p><span className="font-semibold">Status:</span> {submission.status}</p>
            <p><span className="font-semibold">Waktu kirim:</span> {formatDate(submission.created_at)}</p>
            <p><span className="font-semibold">Pengirim tidak dikenal:</span> {submission.unknown_sender ? "Ya" : "Tidak"}</p>
            <p><span className="font-semibold">Parsing error:</span> {submission.parsing_error ? "Ya" : "Tidak"}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <p><span className="font-semibold">Tipe:</span> {typeLabel(submission.type)}</p>
            <p><span className="font-semibold">Judul:</span> {submission.title || "-"}</p>
            <p><span className="font-semibold">Penulis:</span> {submission.author || "-"}</p>
            <p><span className="font-semibold">Tahun:</span> {submission.year || "-"}</p>
            <p><span className="font-semibold">Kategori/topik:</span> {submission.category || "-"}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Raw message</p>
            <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{submission.raw_message || "-"}</pre>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deskripsi / abstrak</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{submission.description || "-"}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditSubmissionDialog({ submission }: { submission: SubmissionRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({
    title: submission.title ?? "",
    author: submission.author ?? "",
    year: submission.year ? String(submission.year) : "",
    category: submission.category ?? "",
    description: submission.description ?? "",
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateDraftSubmission({
        id: submission.id,
        ...values,
      });

      if (!result.ok) {
        toast.error("Gagal memperbarui submission", { description: result.message });
        return;
      }

      toast.success(result.message);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="rounded-xl">
          <Pencil />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit submission WhatsApp</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Judul" className="sm:col-span-2">
              <Input value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} />
            </Field>
            <Field label="Penulis / mahasiswa">
              <Input value={values.author} onChange={(event) => setValues({ ...values, author: event.target.value })} />
            </Field>
            <Field label="Tahun">
              <Input value={values.year} onChange={(event) => setValues({ ...values, year: event.target.value })} />
            </Field>
            <Field label="Kategori / topik" className="sm:col-span-2">
              <Input value={values.category} onChange={(event) => setValues({ ...values, category: event.target.value })} />
            </Field>
            <Field label="Deskripsi / abstrak" className="sm:col-span-2">
              <Textarea
                value={values.description}
                onChange={(event) => setValues({ ...values, description: event.target.value })}
                className="min-h-28"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: DraftSubmissionStatus }) {
  const tone = {
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-rose-200 bg-rose-50 text-rose-700",
  }[status];

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
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

function typeLabel(type: DraftSubmissionType | null) {
  if (type === "book") return "Buku";
  if (type === "thesis") return "Skripsi";
  return "Perlu diperbaiki";
}

function getSenderName(
  submission: SubmissionRow,
  profilesById: Record<string, SenderProfile>,
  petugasByPhone: Record<string, { nama: string | null; profile_id: string | null }>,
) {
  if (submission.submitted_by && profilesById[submission.submitted_by]) {
    return profilesById[submission.submitted_by].full_name ?? profilesById[submission.submitted_by].email ?? "Profil petugas";
  }

  const petugas = submission.sender_phone ? petugasByPhone[submission.sender_phone] : undefined;
  if (petugas?.profile_id && profilesById[petugas.profile_id]) {
    return profilesById[petugas.profile_id].full_name ?? petugas.nama ?? "Petugas WhatsApp";
  }

  return petugas?.nama ?? submission.sender_name ?? "Pengirim WhatsApp";
}
