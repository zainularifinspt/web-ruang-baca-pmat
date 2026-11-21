"use client";

import { FormEvent, useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createPetugasAccount } from "@/app/admin/petugas/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PetugasForm() {
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await createPetugasAccount({
        fullName,
        email,
        password,
        confirmPassword,
      });

      if (result.ok) {
        toast.success(result.message);
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        toast.error("Gagal membuat petugas", { description: result.message });
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama">
          <Input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Nama petugas"
            autoComplete="name"
            disabled={isPending}
            required
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="petugas@kampus.ac.id"
            autoComplete="email"
            disabled={isPending}
            required
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimal 6 karakter"
            autoComplete="new-password"
            disabled={isPending}
            minLength={6}
            required
          />
        </Field>
        <Field label="Konfirmasi password">
          <Input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Ulangi password"
            autoComplete="new-password"
            disabled={isPending}
            minLength={6}
            required
          />
        </Field>
      </div>
      <div className="flex justify-end border-t pt-4">
        <Button type="submit" className="rounded-xl" disabled={isPending}>
          <UserPlus />
          {isPending ? "Membuat akun..." : "Tambah petugas"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
