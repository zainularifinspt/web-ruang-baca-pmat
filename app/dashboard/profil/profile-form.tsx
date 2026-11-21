"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import {
  updateOwnPassword,
  updateOwnProfileName,
} from "@/app/dashboard/profil/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileForm({
  fullName,
  email,
  roleLabel,
}: {
  fullName: string;
  email: string;
  roleLabel: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const hasChanges = name.trim().replace(/\s+/g, " ") !== fullName.trim().replace(/\s+/g, " ");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateOwnProfileName(name);

      if (!result.ok) {
        toast.error("Gagal memperbarui profil", { description: result.message });
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startPasswordTransition(async () => {
      const result = await updateOwnPassword(password, confirmation);

      if (!result.ok) {
        toast.error("Gagal memperbarui password", { description: result.message });
        return;
      }

      toast.success(result.message);
      setPassword("");
      setConfirmation("");
    });
  }

  return (
    <div className="grid gap-8">
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama tampilan" icon={<UserRound />}>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama yang tampil di dashboard"
              required
            />
          </Field>
          <Field label="Email akun" icon={<Mail />}>
            <Input value={email || "-"} disabled />
          </Field>
          <Field label="Peran dashboard" icon={<ShieldCheck />}>
            <Input value={roleLabel} disabled />
          </Field>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !hasChanges}
            onClick={() => setName(fullName)}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isPending || !hasChanges}>
            {isPending ? "Menyimpan..." : "Simpan profil"}
          </Button>
        </div>
      </form>

      <form className="grid gap-5 border-t border-slate-200 pt-6" onSubmit={handlePasswordSubmit}>
        <div>
          <h3 className="text-base font-semibold text-slate-950">Ganti password</h3>
          <p className="mt-1 text-sm text-slate-500">
            Gunakan minimal 8 karakter untuk password baru.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password baru" icon={<LockKeyhole />}>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password baru"
              required
            />
          </Field>
          <Field label="Konfirmasi password" icon={<LockKeyhole />}>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Ulangi password baru"
              required
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPasswordPending || !password || !confirmation}>
            {isPasswordPending ? "Menyimpan..." : "Simpan password"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <span className="text-primary [&_svg]:size-4">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}
