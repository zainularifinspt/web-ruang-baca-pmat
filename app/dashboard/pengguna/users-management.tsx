"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { Download, FileSpreadsheet, KeyRound, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { InitialAvatar } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { roleLabels } from "@/lib/mock-data";
import type { Role, VisitorStatus } from "@/lib/types";
import {
  deleteManagedUser,
  resetManagedUserPassword,
  saveManagedUser,
  type ManagedUserRole,
} from "@/app/dashboard/pengguna/actions";

export type ManagedUser = {
  id: string;
  email: string;
  fullName: string;
  nimNip: string;
  phoneNumber: string;
  role: Role;
};

const editableRoles: ManagedUserRole[] = ["dosen", "mahasiswa", "petugas"];

const emptyForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  nimNip: "",
  phoneNumber: "",
  role: "mahasiswa" as ManagedUserRole,
};

type ImportUserRow = {
  rowNumber: number;
  fullName: string;
  nimNip: string;
  visitorStatus: VisitorStatus;
  studyProgram: string;
  status: "ready" | "success" | "error";
  message: string;
};

export function UsersManagement({ users }: { users: ManagedUser[] }) {
  const sortedUsers = useMemo(
    () =>
      [...users].sort((first, second) => {
        if (first.role === "admin" && second.role !== "admin") return -1;
        if (first.role !== "admin" && second.role === "admin") return 1;
        return first.fullName.localeCompare(second.fullName);
      }),
    [users],
  );

  return (
    <Table className="min-w-[920px]">
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>NIM/NIP</TableHead>
              <TableHead>No. WhatsApp</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead className="w-[360px] text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedUsers.length ? (
          sortedUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <InitialAvatar name={user.fullName || user.email} />
                  <span className="font-semibold text-slate-950">{user.fullName || "Tanpa nama"}</span>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.nimNip || "-"}</TableCell>
              <TableCell>{user.phoneNumber || "-"}</TableCell>
              <TableCell>
                <Badge variant="secondary">{roleLabels[user.role]}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {user.role === "admin" ? (
                  <Button variant="outline" size="sm" disabled>
                    Admin
                  </Button>
                ) : (
                  <div className="flex justify-end gap-2">
                    <UserDialog user={user} />
                    <ResetPasswordDialog user={user} />
                    <DeleteUserButton user={user} />
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="py-8">
              <EmptyState
                title="Belum ada pengguna"
                description="Pengguna akan tampil di sini setelah ditambahkan."
                className="border-slate-200 bg-slate-50/70"
              />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function UsersPageActions({ users }: { users: ManagedUser[] }) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-primary">Aksi pengguna</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">
          Kelola data akun dan identitas presensi
        </h2>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <AddUserButton />
        <ImportUsersDialog />
        <ExportUsersButton users={users} />
      </div>
    </section>
  );
}

export function AddUserButton() {
  return <UserDialog />;
}

function ExportUsersButton({ users }: { users: ManagedUser[] }) {
  async function handleExport() {
    try {
      const XLSX = await import("xlsx");
      const rows = users.map((user) => ({
        full_name: user.fullName,
        email: user.email,
        nim_nip: user.nimNip,
        phone_number: user.phoneNumber,
        role: user.role,
        role_label: roleLabels[user.role],
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Pengguna");
      XLSX.writeFile(workbook, "export-pengguna.xlsx");
      toast.success("Ekspor pengguna selesai", {
        description: `${rows.length} pengguna diunduh sebagai XLSX.`,
      });
    } catch (error) {
      toast.error("Gagal ekspor pengguna", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat membuat XLSX.",
      });
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" className="rounded-xl bg-white" onClick={handleExport}>
      <Download />
      Ekspor pengguna
    </Button>
  );
}

function ImportUsersDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportUserRow[]>([]);
  const [isPending, startTransition] = useTransition();
  const readyCount = rows.filter((row) => row.status === "ready").length;

  function handlePrepare() {
    if (!file) {
      toast.error("File XLSX/CSV wajib dipilih.");
      return;
    }

    startTransition(async () => {
      try {
        setRows(await parseUsersSpreadsheet(file));
      } catch (error) {
        toast.error("Gagal membaca file import pengguna", {
          description: error instanceof Error ? error.message : "Periksa format spreadsheet.",
        });
      }
    });
  }

  function handleImport() {
    const importableRows = rows.filter((row) => row.status === "ready");
    if (!importableRows.length) {
      toast.error("Tidak ada baris yang siap diimport.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/attendance/visitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: importableRows.map((row) => ({
              full_name: row.fullName,
              nim_nip: row.nimNip,
              visitor_status: row.visitorStatus,
              study_program: row.studyProgram,
            })),
          }),
        });
        const payload = (await response.json()) as { imported?: number; error?: string };

        if (!response.ok || payload.error) {
          throw new Error(payload.error ?? "Gagal mengimport data presensi.");
        }

        setRows((currentRows) =>
          currentRows.map((item) =>
            item.status === "ready"
              ? { ...item, status: "success", message: "Berhasil diimport untuk presensi." }
              : item,
          ),
        );
        toast.success("Import data presensi selesai.", {
          description: `${payload.imported ?? importableRows.length} data pengunjung tersimpan.`,
        });
      } catch (error) {
        setRows((currentRows) =>
          currentRows.map((item) =>
            item.status === "ready"
              ? {
                  ...item,
                  status: "error",
                  message: error instanceof Error ? error.message : "Gagal mengimport data presensi.",
                }
              : item,
          ),
        );
        toast.error("Gagal import data presensi", {
          description: error instanceof Error ? error.message : "Terjadi kesalahan saat import.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="rounded-xl bg-white">
          <Upload />
          Import pengguna
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Import pengguna</DialogTitle>
          <DialogDescription>
            Upload XLSX/CSV berisi nama dan NIM/NIP untuk autofill form presensi. Import ini tidak membuat akun login.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-950">Template XLSX</p>
              <p className="mt-1">
                Kolom: full_name, nim_nip, role, study_program. Role berisi mahasiswa, dosen, atau umum.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" className="rounded-xl bg-white" onClick={downloadUsersTemplate}>
              <Download className="size-4" />
              Download template
            </Button>
          </div>
        </div>

        <label>
          <span className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
            <FileSpreadsheet className="size-4" />
            Spreadsheet pengguna
          </span>
          <Input
            type="file"
            accept=".xlsx,.xls,.csv"
            disabled={isPending}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {rows.length ? `${rows.length} baris dibaca. ${readyCount} siap import.` : "Pilih file lalu klik Baca file import."}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="rounded-xl" disabled={isPending || !file} onClick={handlePrepare}>
              {isPending ? "Membaca..." : "Baca file import"}
            </Button>
            <Button type="button" className="rounded-xl" disabled={isPending || readyCount === 0} onClick={handleImport}>
              {isPending ? "Memproses..." : `Import ${readyCount} pengguna`}
            </Button>
          </div>
        </div>

        {rows.length ? (
          <div className="max-h-72 overflow-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Baris</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIM/NIP</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.rowNumber}>
                    <TableCell>{row.rowNumber}</TableCell>
                    <TableCell>{row.fullName || "-"}</TableCell>
                    <TableCell>{row.nimNip || "-"}</TableCell>
                    <TableCell>
                      <span className={row.status === "error" ? "text-rose-700" : row.status === "success" ? "text-red-700" : "text-slate-600"}>
                        {row.status === "ready" ? "Siap" : row.status === "success" ? "Berhasil" : "Error"}
                      </span>
                      {row.message ? <p className="mt-1 text-xs text-slate-500">{row.message}</p> : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function UserDialog({ user }: { user?: ManagedUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState(() =>
    user
      ? {
          fullName: user.fullName,
          email: user.email,
          password: "",
          confirmPassword: "",
          nimNip: user.nimNip,
          phoneNumber: user.phoneNumber,
          role: (editableRoles.includes(user.role as ManagedUserRole)
            ? user.role
            : "mahasiswa") as ManagedUserRole,
        }
      : emptyForm,
  );
  const isEditing = Boolean(user);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await saveManagedUser({
        userId: user?.id,
        ...values,
      });

      if (!result.ok) {
        toast.error(isEditing ? "Gagal memperbarui pengguna" : "Gagal menambahkan pengguna", {
          description: result.message,
        });
        return;
      }

      toast.success(result.message);
      setOpen(false);
      if (!isEditing) setValues(emptyForm);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={isEditing ? "outline" : "default"} className="rounded-xl">
          {isEditing ? <Pencil /> : <Plus />}
          {isEditing ? "Ubah peran" : "Tambah Pengguna"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Ubah pengguna" : "Tambah pengguna"}</DialogTitle>
          <DialogDescription>
            Simpan akun dan tetapkan role aplikasi pengguna.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama lengkap">
              <Input
                value={values.fullName}
                onChange={(event) => setValues({ ...values, fullName: event.target.value })}
                placeholder="Nama pengguna"
                required
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={values.email}
                onChange={(event) => setValues({ ...values, email: event.target.value })}
                placeholder="nama@ulm.ac.id"
                required
              />
            </Field>
            <Field label="NIM/NIP">
              <Input
                value={values.nimNip}
                onChange={(event) => setValues({ ...values, nimNip: event.target.value })}
                placeholder="NIM atau NIP"
                required
              />
            </Field>
            <Field label="No. WhatsApp">
              <Input
                value={values.phoneNumber}
                onChange={(event) => setValues({ ...values, phoneNumber: event.target.value })}
                placeholder="+62812..."
                required
              />
            </Field>
            <Field label="Role">
              <Select
                value={values.role}
                onValueChange={(role) => setValues({ ...values, role: role as ManagedUserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {editableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {!isEditing ? (
              <>
                <Field label="Password">
                  <Input
                    type="password"
                    value={values.password}
                    onChange={(event) => setValues({ ...values, password: event.target.value })}
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </Field>
                <Field label="Konfirmasi password">
                  <Input
                    type="password"
                    value={values.confirmPassword}
                    onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })}
                    placeholder="Ulangi password"
                    required
                  />
                </Field>
              </>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : isEditing ? "Simpan perubahan" : "Tambah pengguna"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user }: { user: ManagedUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await resetManagedUserPassword({
        userId: user.id,
        password,
        confirmPassword,
      });

      if (!result.ok) {
        toast.error("Gagal reset password pengguna", { description: result.message });
        return;
      }

      toast.success(result.message);
      setOpen(false);
      setPassword("");
      setConfirmPassword("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-xl">
          <KeyRound />
          Reset password pengguna
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Reset password pengguna</DialogTitle>
          <DialogDescription>
            Atur password baru untuk {user.fullName || user.email}.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="Password baru">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimal 6 karakter"
              required
            />
          </Field>
          <Field label="Konfirmasi password baru">
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Ulangi password"
              required
            />
          </Field>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Mereset..." : "Reset password pengguna"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserButton({ user }: { user: ManagedUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteManagedUser(user.id);

      if (!result.ok) {
        toast.error("Gagal menghapus pengguna", { description: result.message });
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
        <Button size="sm" variant="destructive" className="rounded-xl">
          <Trash2 />
          Hapus
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Hapus pengguna?</DialogTitle>
          <DialogDescription>
            Akun {user.fullName || user.email} akan dihapus dari sistem.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Batal
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Menghapus..." : "Hapus pengguna"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

async function parseUsersSpreadsheet(file: File): Promise<ImportUserRow[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : null;

  if (!sheet) throw new Error("Sheet pertama tidak ditemukan.");

  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return records.map((record, index) => normalizeUserImportRow(record, index + 2));
}

function normalizeUserImportRow(record: Record<string, unknown>, rowNumber: number): ImportUserRow {
  const parsedStatus = normalizeImportVisitorStatus(getText(record, ["role", "visitor_status", "status", "peran"]));
  const row: ImportUserRow = {
    rowNumber,
    fullName: getText(record, ["full_name", "nama", "nama_lengkap"]),
    nimNip: getText(record, ["nim_nip", "nim", "nip", "nim/nip"]),
    visitorStatus: parsedStatus || "Mahasiswa",
    studyProgram: getText(record, ["study_program", "program_studi"]) || "Pendidikan Matematika",
    status: "ready",
    message: "",
  };
  const missing = [
    ["full_name", row.fullName],
    ["nim_nip", row.nimNip],
  ]
    .filter(([, value]) => !value)
    .map(([label]) => label);

  if (!parsedStatus) missing.push("role");
  if (missing.length) {
    return {
      ...row,
      status: "error",
      message: `Kolom wajib kosong/tidak valid: ${missing.join(", ")}.`,
    };
  }

  return row;
}

function normalizeImportVisitorStatus(value: string): VisitorStatus | "" {
  const normalized = value.trim().toLowerCase();

  if (normalized === "dosen") return "Dosen";
  if (normalized === "umum") return "Umum";
  if (normalized === "mahasiswa") return "Mahasiswa";
  return "";
}

function getText(record: Record<string, unknown>, keys: string[]) {
  const normalizedRecord = Object.fromEntries(
    Object.entries(record).map(([key, value]) => [normalizeKey(key), value]),
  );

  for (const key of keys) {
    const value = normalizedRecord[normalizeKey(key)];
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);
  }

  return "";
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/\s+/g, "_");
}

async function downloadUsersTemplate() {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet([
    {
      full_name: "Ahmad Fauzi",
      nim_nip: "2311040007",
      role: "mahasiswa",
      study_program: "Pendidikan Matematika",
    },
    {
      full_name: "Dr. Siti Rahma, M.Pd.",
      nim_nip: "198705142019032008",
      role: "dosen",
      study_program: "Pendidikan Matematika",
    },
  ]);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Import Pengguna");
  XLSX.writeFile(workbook, "template-import-pengguna.xlsx");
}
