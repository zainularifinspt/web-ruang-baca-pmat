"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { Ban, Check, Info, Plus, RotateCcw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  cancelLoan,
  createLoan,
  markLoanReturned,
  type CreateLoanInput,
} from "@/app/admin/peminjaman/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type {
  LoanCollectionOption,
  LoanItemType,
  LoanListItem,
  LoanStatus,
} from "@/lib/loans";
import { cn } from "@/lib/utils";

const statusOptions: Array<{ label: string; value: LoanStatus | "all" }> = [
  { label: "Semua status", value: "all" },
  { label: "Aktif", value: "active" },
  { label: "Dikembalikan", value: "returned" },
  { label: "Terlambat", value: "overdue" },
  { label: "Dibatalkan", value: "cancelled" },
];

const emptyLoanInput = (): CreateLoanInput => {
  const today = localDateString();
  return {
    borrowerName: "",
    phone: "",
    identityNumber: "",
    borrowerType: "",
    itemType: "book",
    itemId: "",
    loanDate: today,
    dueDate: addDays(today, 7),
    notes: "",
  };
};

export function LoansManager({
  loans,
  availableBooks,
  availableTheses,
}: {
  loans: LoanListItem[];
  availableBooks: LoanCollectionOption[];
  availableTheses: LoanCollectionOption[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LoanStatus | "all">("all");
  const filteredLoans = useMemo(
    () => filterLoans(loans, search, status),
    [loans, search, status],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <label>
            <span className="mb-2 block text-xs font-medium text-slate-500">Cari peminjaman</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nama, nomor HP, judul koleksi"
                className="pl-9"
              />
            </div>
          </label>
          <label>
            <span className="mb-2 block text-xs font-medium text-slate-500">Filter status</span>
            <Select value={status} onValueChange={(value) => setStatus(value as LoanStatus | "all")}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
        <AddLoanDialog availableBooks={availableBooks} availableTheses={availableTheses} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead>Peminjam</TableHead>
              <TableHead>Koleksi</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Tanggal pinjam</TableHead>
              <TableHead>Harus kembali</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLoans.length ? (
              filteredLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>
                    <p className="font-semibold text-slate-950">{loan.borrowerName}</p>
                    <p className="mt-1 text-sm text-slate-500">{loan.borrowerPhone}</p>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="font-medium text-slate-900">{loan.itemTitle}</p>
                    <p className="mt-1 truncate text-sm text-slate-500">{loan.itemSubtitle || "-"}</p>
                  </TableCell>
                  <TableCell>{loan.itemType === "book" ? "Buku" : "Skripsi"}</TableCell>
                  <TableCell>{formatDateOnly(loan.loanDate)}</TableCell>
                  <TableCell>{formatDateOnly(loan.dueDate)}</TableCell>
                  <TableCell><LoanStatusBadge status={loan.status} /></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <LoanDetailDialog loan={loan} />
                      {loan.status === "active" || loan.status === "overdue" ? (
                        <>
                          <LoanActionButton
                            icon={RotateCcw}
                            label="Tandai Dikembalikan"
                            tone="emerald"
                            action={() => markLoanReturned(loan.id)}
                          />
                          <LoanActionButton
                            icon={Ban}
                            label="Batalkan"
                            tone="rose"
                            action={() => cancelLoan(loan.id)}
                          />
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                  Tidak ada data peminjaman sesuai filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AddLoanDialog({
  availableBooks,
  availableTheses,
}: {
  availableBooks: LoanCollectionOption[];
  availableTheses: LoanCollectionOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<CreateLoanInput>(() => emptyLoanInput());
  const [collectionSearch, setCollectionSearch] = useState("");
  const options = values.itemType === "book" ? availableBooks : availableTheses;
  const filteredOptions = filterCollectionOptions(options, collectionSearch);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createLoan(values);

      if (!result.ok) {
        toast.error("Gagal mencatat peminjaman", { description: result.message });
        return;
      }

      if (result.whatsappOk === false) {
        toast.warning(result.message);
      } else {
        toast.success(result.message);
      }

      setValues(emptyLoanInput());
      setCollectionSearch("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">
          <Plus />
          Tambah Peminjaman
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Peminjaman</DialogTitle>
          <DialogDescription>
            Catat peminjaman baru dan kirim notifikasi WhatsApp ke peminjam.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama peminjam" className="sm:col-span-2">
              <Input
                value={values.borrowerName}
                onChange={(event) => setValues({ ...values, borrowerName: event.target.value })}
                disabled={isPending}
                required
              />
            </Field>
            <Field label="Nomor HP/WhatsApp">
              <Input
                value={values.phone}
                onChange={(event) => setValues({ ...values, phone: event.target.value })}
                placeholder="085787724934"
                disabled={isPending}
                required
              />
            </Field>
            <Field label="Identitas opsional">
              <Input
                value={values.identityNumber}
                onChange={(event) => setValues({ ...values, identityNumber: event.target.value })}
                placeholder="NIM/NIP/Umum"
                disabled={isPending}
              />
            </Field>
            <Field label="Tipe peminjam">
              <Input
                value={values.borrowerType}
                onChange={(event) => setValues({ ...values, borrowerType: event.target.value })}
                placeholder="Mahasiswa, Dosen, Umum"
                disabled={isPending}
              />
            </Field>
            <Field label="Tipe koleksi">
              <Select
                value={values.itemType}
                disabled={isPending}
                onValueChange={(itemType) => {
                  setValues({ ...values, itemType: itemType as LoanItemType, itemId: "" });
                  setCollectionSearch("");
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="book">Buku</SelectItem>
                  <SelectItem value="thesis">Skripsi</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Cari koleksi" className="sm:col-span-2">
              <Input
                value={collectionSearch}
                onChange={(event) => setCollectionSearch(event.target.value)}
                placeholder="Ketik judul atau penulis"
                disabled={isPending}
              />
            </Field>
            <Field label="Koleksi yang dipinjam" className="sm:col-span-2">
              <Select
                value={values.itemId}
                disabled={isPending || !filteredOptions.length}
                onValueChange={(itemId) => setValues({ ...values, itemId })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={filteredOptions.length ? "Pilih koleksi" : "Tidak ada koleksi tersedia"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.title} {option.subtitle ? `- ${option.subtitle}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tanggal pinjam">
              <Input
                type="date"
                value={values.loanDate}
                disabled={isPending}
                onChange={(event) => {
                  const loanDate = event.target.value;
                  setValues({ ...values, loanDate, dueDate: addDays(loanDate, 7) });
                }}
                required
              />
            </Field>
            <Field label="Tanggal harus kembali">
              <Input
                type="date"
                value={values.dueDate}
                disabled={isPending}
                onChange={(event) => setValues({ ...values, dueDate: event.target.value })}
                required
              />
            </Field>
            <Field label="Catatan" className="sm:col-span-2">
              <Textarea
                value={values.notes}
                onChange={(event) => setValues({ ...values, notes: event.target.value })}
                disabled={isPending}
                className="min-h-24"
              />
            </Field>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-xl" disabled={isPending} onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="rounded-xl" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LoanDetailDialog({ loan }: { loan: LoanListItem }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          <Info />
          Detail
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Detail Peminjaman</DialogTitle>
          <DialogDescription>
            Informasi peminjam, koleksi, status, dan riwayat notifikasi.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 lg:grid-cols-2">
          <DetailPanel title="Peminjam">
            <Meta label="Nama" value={loan.borrowerName} />
            <Meta label="Nomor HP" value={loan.borrowerPhone} />
            <Meta label="Identitas" value={loan.identityNumber || "-"} />
            <Meta label="Tipe peminjam" value={loan.borrowerType || "-"} />
          </DetailPanel>
          <DetailPanel title="Koleksi">
            <Meta label="Judul" value={loan.itemTitle} />
            <Meta label="Tipe" value={loan.itemType === "book" ? "Buku" : "Skripsi"} />
            <Meta label="Keterangan" value={loan.itemSubtitle || "-"} />
            <div className="pt-1"><LoanStatusBadge status={loan.status} /></div>
          </DetailPanel>
          <DetailPanel title="Jadwal">
            <Meta label="Tanggal pinjam" value={formatDateOnly(loan.loanDate)} />
            <Meta label="Harus kembali" value={formatDateOnly(loan.dueDate)} />
            <Meta label="Dikembalikan" value={loan.returnedAt ? formatDateTime(loan.returnedAt) : "-"} />
          </DetailPanel>
          <DetailPanel title="Riwayat notifikasi">
            <Meta label="Peminjaman berhasil" value={loan.successNotifiedAt ? formatDateTime(loan.successNotifiedAt) : "Belum/ gagal"} />
            <Meta label="Reminder H-1" value={loan.reminderH1SentAt ? formatDateTime(loan.reminderH1SentAt) : "Belum dikirim"} />
            <Meta label="Reminder hari H" value={loan.reminderDueSentAt ? formatDateTime(loan.reminderDueSentAt) : "Belum dikirim"} />
          </DetailPanel>
          <div className="rounded-2xl bg-slate-50 p-4 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Catatan</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{loan.notes || "-"}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LoanActionButton({
  icon: Icon,
  label,
  tone,
  action,
}: {
  icon: typeof Check;
  label: string;
  tone: "emerald" | "rose";
  action: () => Promise<{ ok: boolean; message: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "rounded-xl",
        tone === "emerald" ? "text-emerald-700 hover:text-emerald-800" : "text-rose-700 hover:text-rose-800",
      )}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await action();
          if (result.ok) {
            toast.success(result.message);
            router.refresh();
          } else {
            toast.error("Aksi gagal", { description: result.message });
          }
        });
      }}
    >
      <Icon />
      <span className="sr-only">{label}</span>
    </Button>
  );
}

function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const tone: Record<LoanStatus, string> = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    returned: "border-slate-200 bg-slate-50 text-slate-700",
    overdue: "border-rose-200 bg-rose-50 text-rose-700",
    cancelled: "border-amber-200 bg-amber-50 text-amber-700",
  };
  const label: Record<LoanStatus, string> = {
    active: "Aktif",
    returned: "Dikembalikan",
    overdue: "Terlambat",
    cancelled: "Dibatalkan",
  };

  return <Badge className={cn("rounded-full border", tone[status])}>{label[status]}</Badge>;
}

function DetailPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="grid gap-2 text-sm text-slate-700">{children}</div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-semibold text-slate-900">{label}:</span> {value}
    </p>
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

function filterLoans(loans: LoanListItem[], search: string, status: LoanStatus | "all") {
  const normalized = search.trim().toLowerCase();
  return loans.filter((loan) => {
    const matchesStatus = status === "all" || loan.status === status;
    const matchesSearch =
      !normalized ||
      [loan.borrowerName, loan.borrowerPhone, loan.itemTitle, loan.itemSubtitle, loan.identityNumber ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    return matchesStatus && matchesSearch;
  });
}

function filterCollectionOptions(options: LoanCollectionOption[], search: string) {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return options;
  return options.filter((option) =>
    [option.title, option.subtitle].join(" ").toLowerCase().includes(normalized),
  );
}

function localDateString() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Makassar",
  }).format(new Date(`${value}T00:00:00+08:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Makassar",
  }).format(new Date(value));
}
