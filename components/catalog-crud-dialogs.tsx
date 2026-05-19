"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createBook,
  createThesis,
  deleteCollection,
  updateBook,
  updateThesis,
} from "@/app/dashboard/katalog/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  BookFormValues,
  CatalogActionResult,
  ThesisFormValues,
} from "@/lib/catalog-crud-types";
import type { Book, Thesis, VerificationStatus } from "@/lib/types";

const verificationStatuses: VerificationStatus[] = [
  "Menunggu Verifikasi",
  "Disetujui",
  "Perlu Revisi",
  "Ditolak",
];

const emptyBookValues: BookFormValues = {
  title: "",
  author: "",
  category: "",
  location: "",
  stock: 1,
  status: "Menunggu Verifikasi",
};

const emptyThesisValues: ThesisFormValues = {
  title: "",
  authorName: "",
  year: new Date().getFullYear(),
  topic: "",
  abstract: "",
  supervisor1: "",
  supervisor2: "",
  verificationStatus: "Menunggu Verifikasi",
};

export function AddBookDialog() {
  const [values, setValues] = useState<BookFormValues>(emptyBookValues);

  return (
    <BookDialog
      title="Tambah Buku"
      description="Simpan data buku langsung ke tabel books Supabase."
      submitLabel="Simpan buku"
      values={values}
      onValuesChange={setValues}
      onSubmit={async () => createBook(values)}
      onSuccess={() => setValues(emptyBookValues)}
      trigger={
        <Button size="sm" className="rounded-xl">
          <Plus />
          Tambah buku
        </Button>
      }
    />
  );
}

export function AddThesisDialog() {
  const [values, setValues] = useState<ThesisFormValues>(emptyThesisValues);

  return (
    <ThesisDialog
      title="Tambah Skripsi"
      description="Simpan data skripsi langsung ke tabel theses Supabase."
      submitLabel="Simpan skripsi"
      values={values}
      onValuesChange={setValues}
      onSubmit={async () => createThesis(values)}
      onSuccess={() => setValues(emptyThesisValues)}
      trigger={
        <Button size="sm" className="rounded-xl">
          <Plus />
          Tambah skripsi
        </Button>
      }
    />
  );
}

export function EditCollectionDialog({ item }: { item: Book | Thesis }) {
  if (item.type === "book") {
    return <EditBookDialog item={item} />;
  }

  return <EditThesisDialog item={item} />;
}

export function DeleteCollectionDialog({ item }: { item: Book | Thesis }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCollection(item.type, item.id);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Gagal menghapus data", { description: result.message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl text-rose-700 hover:text-rose-800">
          <Trash2 />
          Hapus
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Hapus {item.type === "book" ? "buku" : "skripsi"}?</DialogTitle>
          <DialogDescription>
            Data "{item.title}" akan dihapus dari Supabase. Tindakan ini tidak dapat
            dibatalkan dari aplikasi.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-xl" disabled={isPending}>
              Batal
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            className="rounded-xl"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? "Menghapus..." : "Hapus data"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditBookDialog({ item }: { item: Book }) {
  const [values, setValues] = useState<BookFormValues>({
    title: item.title,
    author: item.author,
    category: item.category,
    location: item.location,
    stock: item.stock,
    status: item.verificationStatus,
  });

  return (
    <BookDialog
      title="Edit Buku"
      description="Perbarui data buku di Supabase."
      submitLabel="Simpan perubahan"
      values={values}
      onValuesChange={setValues}
      onSubmit={async () => updateBook(item.id, values)}
      trigger={
        <Button variant="outline" size="sm" className="rounded-xl">
          <Edit3 />
          Edit
        </Button>
      }
    />
  );
}

function EditThesisDialog({ item }: { item: Thesis }) {
  const [values, setValues] = useState<ThesisFormValues>({
    title: item.title,
    authorName: item.authorName,
    year: item.year,
    topic: item.keywords[0] ?? "",
    abstract: item.abstract,
    supervisor1: item.supervisor1,
    supervisor2: item.supervisor2,
    verificationStatus: item.verificationStatus,
  });

  return (
    <ThesisDialog
      title="Edit Skripsi"
      description="Perbarui data skripsi di Supabase."
      submitLabel="Simpan perubahan"
      values={values}
      onValuesChange={setValues}
      onSubmit={async () => updateThesis(item.id, values)}
      trigger={
        <Button variant="outline" size="sm" className="rounded-xl">
          <Edit3 />
          Edit
        </Button>
      }
    />
  );
}

function BookDialog({
  title,
  description,
  submitLabel,
  values,
  onValuesChange,
  onSubmit,
  onSuccess,
  trigger,
}: {
  title: string;
  description: string;
  submitLabel: string;
  values: BookFormValues;
  onValuesChange: (values: BookFormValues) => void;
  onSubmit: () => Promise<CatalogActionResult>;
  onSuccess?: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const form = useCatalogFormSubmit({ onSubmit, onSuccess, onClose: () => setOpen(false) });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={form.handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Judul" className="sm:col-span-2">
              <Input
                value={values.title}
                onChange={(event) => onValuesChange({ ...values, title: event.target.value })}
                placeholder="Judul buku"
                disabled={form.isPending}
                required
              />
            </Field>
            <Field label="Penulis">
              <Input
                value={values.author}
                onChange={(event) => onValuesChange({ ...values, author: event.target.value })}
                placeholder="Nama penulis"
                disabled={form.isPending}
                required
              />
            </Field>
            <Field label="Kategori">
              <Input
                value={values.category}
                onChange={(event) => onValuesChange({ ...values, category: event.target.value })}
                placeholder="Kalkulus, Statistika, ..."
                disabled={form.isPending}
                required
              />
            </Field>
            <Field label="Lokasi rak">
              <Input
                value={values.location}
                onChange={(event) => onValuesChange({ ...values, location: event.target.value })}
                placeholder="Rak A1"
                disabled={form.isPending}
                required
              />
            </Field>
            <Field label="Stok">
              <Input
                type="number"
                min={0}
                value={values.stock}
                onChange={(event) =>
                  onValuesChange({ ...values, stock: Number(event.target.value) })
                }
                disabled={form.isPending}
                required
              />
            </Field>
            <Field label="Status" className="sm:col-span-2">
              <StatusSelect
                value={values.status}
                disabled={form.isPending}
                onValueChange={(status) => onValuesChange({ ...values, status })}
              />
            </Field>
          </div>
          <DialogActions isPending={form.isPending} submitLabel={submitLabel} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ThesisDialog({
  title,
  description,
  submitLabel,
  values,
  onValuesChange,
  onSubmit,
  onSuccess,
  trigger,
}: {
  title: string;
  description: string;
  submitLabel: string;
  values: ThesisFormValues;
  onValuesChange: (values: ThesisFormValues) => void;
  onSubmit: () => Promise<CatalogActionResult>;
  onSuccess?: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const form = useCatalogFormSubmit({ onSubmit, onSuccess, onClose: () => setOpen(false) });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={form.handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Judul" className="sm:col-span-2">
              <Input
                value={values.title}
                onChange={(event) => onValuesChange({ ...values, title: event.target.value })}
                placeholder="Judul skripsi"
                disabled={form.isPending}
                required
              />
            </Field>
            <Field label="Nama mahasiswa">
              <Input
                value={values.authorName}
                onChange={(event) =>
                  onValuesChange({ ...values, authorName: event.target.value })
                }
                placeholder="Nama mahasiswa"
                disabled={form.isPending}
                required
              />
            </Field>
            <Field label="Tahun">
              <Input
                type="number"
                min={1900}
                value={values.year}
                onChange={(event) =>
                  onValuesChange({ ...values, year: Number(event.target.value) })
                }
                disabled={form.isPending}
                required
              />
            </Field>
            <Field label="Topik">
              <Input
                value={values.topic}
                onChange={(event) => onValuesChange({ ...values, topic: event.target.value })}
                placeholder="Literasi numerasi"
                disabled={form.isPending}
                required
              />
            </Field>
            <Field label="Status verifikasi">
              <StatusSelect
                value={values.verificationStatus}
                disabled={form.isPending}
                onValueChange={(verificationStatus) =>
                  onValuesChange({ ...values, verificationStatus })
                }
              />
            </Field>
            <Field label="Dosen pembimbing 1">
              <Input
                value={values.supervisor1}
                onChange={(event) =>
                  onValuesChange({ ...values, supervisor1: event.target.value })
                }
                placeholder="Nama pembimbing 1"
                disabled={form.isPending}
                required
              />
            </Field>
            <Field label="Dosen pembimbing 2">
              <Input
                value={values.supervisor2}
                onChange={(event) =>
                  onValuesChange({ ...values, supervisor2: event.target.value })
                }
                placeholder="Nama pembimbing 2"
                disabled={form.isPending}
                required
              />
            </Field>
            <Field label="Abstrak" className="sm:col-span-2">
              <Textarea
                value={values.abstract}
                onChange={(event) => onValuesChange({ ...values, abstract: event.target.value })}
                placeholder="Ringkasan penelitian"
                disabled={form.isPending}
                required
              />
            </Field>
          </div>
          <DialogActions isPending={form.isPending} submitLabel={submitLabel} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function useCatalogFormSubmit({
  onSubmit,
  onSuccess,
  onClose,
}: {
  onSubmit: () => Promise<CatalogActionResult>;
  onSuccess?: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await onSubmit();
      if (result.ok) {
        toast.success(result.message);
        onSuccess?.();
        onClose();
        router.refresh();
      } else {
        toast.error("Gagal menyimpan data", { description: result.message });
      }
    });
  };

  return { isPending, handleSubmit };
}

function StatusSelect({
  value,
  disabled,
  onValueChange,
}: {
  value: VerificationStatus;
  disabled?: boolean;
  onValueChange: (value: VerificationStatus) => void;
}) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(nextValue) => onValueChange(nextValue as VerificationStatus)}
    >
      <SelectTrigger className="rounded-xl">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {verificationStatuses.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
      <span className="mb-2 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function DialogActions({
  isPending,
  submitLabel,
}: {
  isPending: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
      <DialogClose asChild>
        <Button type="button" variant="outline" className="rounded-xl" disabled={isPending}>
          Batal
        </Button>
      </DialogClose>
      <Button type="submit" className="rounded-xl" disabled={isPending}>
        {isPending ? "Menyimpan..." : submitLabel}
      </Button>
    </div>
  );
}
