"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { updateOwnProfileName } from "@/app/dashboard/profil/actions";
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
  const [isPending, startTransition] = useTransition();
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

  return (
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
