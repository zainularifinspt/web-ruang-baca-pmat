"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { InitialAvatar } from "@/components/data-table";
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
import type { Role } from "@/lib/types";
import { saveManagedUser, type ManagedUserRole } from "@/app/dashboard/pengguna/actions";

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
          <TableHead className="text-right">Aksi</TableHead>
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
                  <UserDialog user={user} />
                )}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="h-28 text-center text-sm text-slate-500">
              Belum ada pengguna dari Supabase.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function AddUserButton() {
  return <UserDialog />;
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
            Simpan akun ke Supabase Auth dan tetapkan role di tabel profiles.
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
            <Field label={isEditing ? "Password baru (opsional)" : "Password"}>
              <Input
                type="password"
                value={values.password}
                onChange={(event) => setValues({ ...values, password: event.target.value })}
                placeholder="Minimal 6 karakter"
                required={!isEditing}
              />
            </Field>
            <Field label={isEditing ? "Konfirmasi password baru" : "Konfirmasi password"}>
              <Input
                type="password"
                value={values.confirmPassword}
                onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })}
                placeholder="Ulangi password"
                required={!isEditing || Boolean(values.password)}
              />
            </Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
