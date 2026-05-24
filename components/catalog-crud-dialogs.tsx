"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Edit3, FileText, Plus, Trash2 } from "lucide-react";
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
  BookStatus,
  CatalogActionResult,
  ThesisFormValues,
} from "@/lib/catalog-crud-types";
import type { Book, Thesis } from "@/lib/types";

const bookStatusOptions: Array<{ label: string; value: BookStatus }> = [
  { label: "Tersedia", value: "tersedia" },
  { label: "Dipinjam", value: "dipinjam" },
  { label: "Arsip", value: "arsip" },
];

const emptyBookValues: BookFormValues = {
  title: "",
  author: "",
  category: "",
  rackLocation: "",
  stock: 1,
  status: "tersedia",
  coverUrl: "",
};

const defaultAccessNote =
  "Dokumen lengkap tersedia dalam bentuk fisik di Ruang Baca Program Studi Pendidikan Matematika.";
const maxPdfSize = 5 * 1024 * 1024;
const maxCoverOriginalSize = 15 * 1024 * 1024;
const maxCoverUploadSize = 900 * 1024;
const maxCoverDimension = 900;
const allowedCoverTypes = ["image/jpeg", "image/png", "image/webp"];

const emptyThesisValues: ThesisFormValues = {
  title: "",
  studentName: "",
  year: new Date().getFullYear(),
  topic: "",
  abstract: "",
  supervisor1: "",
  supervisor2: "",
  coverUrl: "",
  physicalLocation: "",
  accessNote: defaultAccessNote,
  verificationStatus: "pending",
  pdfUrl: "",
  pdfFilename: "",
  pdfSize: 0,
};

export function AddBookDialog() {
  const [values, setValues] = useState<BookFormValues>(emptyBookValues);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  return (
    <BookDialog
      title="Tambah Buku"
      description="Simpan data buku langsung ke tabel books Supabase."
      submitLabel="Simpan buku"
      values={values}
      onValuesChange={setValues}
      coverFile={coverFile}
      onCoverFileChange={setCoverFile}
      onSubmit={async () => createBook(await valuesWithUploadedCover(values, coverFile))}
      onSuccess={() => {
        setValues(emptyBookValues);
        setCoverFile(null);
      }}
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
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  return (
    <ThesisDialog
      title="Tambah Skripsi"
      description="Simpan data skripsi langsung ke tabel theses Supabase."
      submitLabel="Simpan skripsi"
      values={values}
      onValuesChange={setValues}
      pdfFile={pdfFile}
      onPdfFileChange={setPdfFile}
      onSubmit={async () => createThesis(await valuesWithUploadedPdf(values, pdfFile))}
      onSuccess={() => {
        setValues(emptyThesisValues);
        setPdfFile(null);
      }}
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
            Data &quot;{item.title}&quot; akan dihapus dari Supabase. Tindakan ini tidak dapat
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
    rackLocation: item.rackLocation,
    stock: item.stock,
    status: item.status,
    coverUrl: item.coverUrl ?? "",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  return (
    <BookDialog
      title="Edit Buku"
      description="Perbarui data buku di Supabase."
      submitLabel="Simpan perubahan"
      values={values}
      onValuesChange={setValues}
      coverFile={coverFile}
      onCoverFileChange={setCoverFile}
      onSubmit={async () => updateBook(item.id, await valuesWithUploadedCover(values, coverFile))}
      onSuccess={() => setCoverFile(null)}
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
    studentName: item.studentName,
    year: item.year,
    topic: item.topic,
    abstract: item.abstract,
    supervisor1: item.supervisor1,
    supervisor2: item.supervisor2,
    coverUrl: item.coverUrl ?? "",
    physicalLocation: item.physicalLocation,
    accessNote: item.accessNote,
    verificationStatus: item.verificationStatus,
    pdfUrl: item.pdfUrl ?? "",
    pdfFilename: item.pdfFilename ?? "",
    pdfSize: item.pdfSize ?? 0,
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  return (
    <ThesisDialog
      title="Edit Skripsi"
      description=""
      submitLabel="Simpan perubahan"
      values={values}
      onValuesChange={setValues}
      pdfFile={pdfFile}
      onPdfFileChange={setPdfFile}
      onSubmit={async () => updateThesis(item.id, await valuesWithUploadedPdf(values, pdfFile))}
      onSuccess={() => setPdfFile(null)}
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
  coverFile,
  onCoverFileChange,
  onSubmit,
  onSuccess,
  trigger,
}: {
  title: string;
  description: string;
  submitLabel: string;
  values: BookFormValues;
  onValuesChange: (values: BookFormValues) => void;
  coverFile: File | null;
  onCoverFileChange: (file: File | null) => void;
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
                value={values.rackLocation}
                onChange={(event) => onValuesChange({ ...values, rackLocation: event.target.value })}
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
              <BookStatusSelect
                value={values.status}
                disabled={form.isPending}
                onValueChange={(status) => onValuesChange({ ...values, status })}
              />
            </Field>
            <Field label="Cover buku" className="sm:col-span-2">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  const error = validateCoverFile(file);

                  if (error) {
                    toast.error("Cover buku tidak valid", { description: error });
                    event.target.value = "";
                    onCoverFileChange(null);
                    return;
                  }

                  onCoverFileChange(file);
                }}
                disabled={form.isPending}
              />
              <BookCoverFormPreview coverFile={coverFile} coverUrl={values.coverUrl} />
            </Field>
          </div>
          <DialogActions isPending={form.isPending} submitLabel={submitLabel} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BookCoverFormPreview({ coverFile, coverUrl }: { coverFile: File | null; coverUrl: string }) {
  const trimmedCoverUrl = coverUrl.trim();

  if (!coverFile && !trimmedCoverUrl) {
    return (
      <p className="mt-2 text-xs text-slate-500">
        Upload JPG, PNG, atau WebP. Gambar akan dikompres otomatis sebelum disimpan.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500">
      {coverFile ? (
        <span>Cover baru: {coverFile.name}. Akan dikompres otomatis saat disimpan.</span>
      ) : null}
      {trimmedCoverUrl ? (
        <>
          <span>Cover tersimpan saat ini.</span>
          <div className="w-fit rounded-2xl border bg-slate-50 p-2">
            <div
              aria-label="Preview cover buku"
              className="h-40 w-28 rounded-xl bg-slate-100 bg-cover bg-center ring-1 ring-slate-200"
              role="img"
              style={{ backgroundImage: `url(${trimmedCoverUrl})` }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function ThesisDialog({
  title,
  description,
  submitLabel,
  values,
  onValuesChange,
  pdfFile,
  onPdfFileChange,
  onSubmit,
  onSuccess,
  trigger,
}: {
  title: string;
  description: string;
  submitLabel: string;
  values: ThesisFormValues;
  onValuesChange: (values: ThesisFormValues) => void;
  pdfFile: File | null;
  onPdfFileChange: (file: File | null) => void;
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
                value={values.studentName}
                onChange={(event) =>
                  onValuesChange({ ...values, studentName: event.target.value })
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
            <Field label="Cover URL" className="sm:col-span-2">
              <Input
                type="url"
                value={values.coverUrl}
                onChange={(event) => onValuesChange({ ...values, coverUrl: event.target.value })}
                placeholder="https://..."
                disabled={form.isPending}
              />
            </Field>
            <Field label="Lokasi fisik">
              <Input
                value={values.physicalLocation}
                onChange={(event) =>
                  onValuesChange({ ...values, physicalLocation: event.target.value })
                }
                placeholder="Lemari Skripsi 1"
                disabled={form.isPending}
                required
              />
            </Field>
            <Field label="Catatan akses">
              <Textarea
                value={values.accessNote}
                onChange={(event) => onValuesChange({ ...values, accessNote: event.target.value })}
                placeholder={defaultAccessNote}
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
            <Field label="File skripsi PDF" className="sm:col-span-2">
              <Input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  const error = validatePdfFile(file);

                  if (error) {
                    toast.error("File PDF tidak valid", { description: error });
                    event.target.value = "";
                    onPdfFileChange(null);
                    return;
                  }

                  onPdfFileChange(file);
                }}
                disabled={form.isPending}
              />
              <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500">
                <span>Maksimal 5 MB dan hanya menerima file .pdf.</span>
                {pdfFile ? (
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                    <FileText className="size-3.5" />
                    {pdfFile.name}
                  </span>
                ) : values.pdfFilename ? (
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                    <FileText className="size-3.5" />
                    File tersimpan: {values.pdfFilename}
                  </span>
                ) : null}
              </div>
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
      try {
        const result = await onSubmit();
        if (result.ok) {
          toast.success(result.message);
          onSuccess?.();
          onClose();
          router.refresh();
        } else {
          toast.error("Gagal menyimpan data", { description: result.message });
        }
      } catch (error) {
        toast.error("Gagal menyimpan data", {
          description: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan.",
        });
      }
    });
  };

  return { isPending, handleSubmit };
}

function validatePdfFile(file: File | null) {
  if (!file) return null;
  if (file.type !== "application/pdf") return "File harus bertipe application/pdf.";
  if (!file.name.toLowerCase().endsWith(".pdf")) return "Ekstensi file harus .pdf.";
  if (file.size > maxPdfSize) return "Ukuran file PDF maksimal 5 MB.";
  return null;
}

function validateCoverFile(file: File | null) {
  if (!file) return null;
  if (!allowedCoverTypes.includes(file.type)) return "Cover harus berupa gambar JPG, PNG, atau WebP.";
  if (file.size > maxCoverOriginalSize) return "Ukuran file cover maksimal 15 MB sebelum kompresi.";
  return null;
}

async function valuesWithUploadedCover(values: BookFormValues, file: File | null) {
  const error = validateCoverFile(file);
  if (error) throw new Error(error);
  if (!file) return values;

  const compressedCover = await compressCoverImage(file);
  const formData = new FormData();
  formData.append("file", compressedCover);

  const response = await fetch("/api/books/cover", {
    method: "POST",
    body: formData,
  });
  const payload = (await response.json()) as {
    coverUrl?: string;
    error?: string;
  };

  if (!response.ok || payload.error || !payload.coverUrl) {
    throw new Error(payload.error ?? "Gagal mengupload cover buku.");
  }

  return {
    ...values,
    coverUrl: payload.coverUrl,
  };
}

async function compressCoverImage(file: File) {
  const image = await loadImage(file);
  let quality = 0.82;
  let maxDimension = maxCoverDimension;
  let compressed = await drawCompressedCover(image, file, maxDimension, quality);

  while (compressed.size > maxCoverUploadSize && (quality > 0.52 || maxDimension > 640)) {
    quality = Math.max(0.52, quality - 0.08);
    maxDimension = Math.max(640, Math.round(maxDimension * 0.9));
    compressed = await drawCompressedCover(image, file, maxDimension, quality);
  }

  return compressed;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Cover buku tidak dapat dibaca sebagai gambar."));
    };
    image.src = objectUrl;
  });
}

function drawCompressedCover(
  image: HTMLImageElement,
  sourceFile: File,
  maxDimension: number,
  quality: number,
) {
  return new Promise<File>((resolve, reject) => {
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      reject(new Error("Browser tidak dapat memproses kompresi cover."));
      return;
    }

    canvas.width = width;
    canvas.height = height;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Gagal mengompres cover buku."));
          return;
        }

        const filename = `${sourceFile.name.replace(/\.[^.]+$/, "") || "cover"}.webp`;
        resolve(new File([blob], filename, { type: "image/webp" }));
      },
      "image/webp",
      quality,
    );
  });
}

async function valuesWithUploadedPdf(values: ThesisFormValues, file: File | null) {
  const error = validatePdfFile(file);
  if (error) throw new Error(error);
  if (!file) return values;

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/theses/pdf", {
    method: "POST",
    body: formData,
  });
  const payload = (await response.json()) as {
    pdfUrl?: string;
    pdfFilename?: string;
    pdfSize?: number;
    error?: string;
  };

  if (!response.ok || payload.error || !payload.pdfUrl) {
    throw new Error(payload.error ?? "Gagal mengupload file PDF.");
  }

  return {
    ...values,
    pdfUrl: payload.pdfUrl,
    pdfFilename: payload.pdfFilename ?? file.name,
    pdfSize: payload.pdfSize ?? file.size,
  };
}

function BookStatusSelect({
  value,
  disabled,
  onValueChange,
}: {
  value: BookStatus;
  disabled?: boolean;
  onValueChange: (value: BookStatus) => void;
}) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(nextValue) => onValueChange(nextValue as BookStatus)}
    >
      <SelectTrigger className="rounded-xl">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {bookStatusOptions.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            {status.label}
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
