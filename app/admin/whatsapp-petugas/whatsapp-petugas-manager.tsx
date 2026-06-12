"use client";

import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Power, PowerOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveWhatsappPetugas, setWhatsappPetugasActive } from "@/app/admin/whatsapp-petugas/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type WhatsappPetugasRow = {
  id: string;
  profile_id: string | null;
  nama: string | null;
  phone_number: string | null;
  is_active: boolean;
  created_at: string | null;
};

export type ProfileOption = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

const emptyForm = {
  id: "",
  nama: "",
  phoneNumber: "",
  profileId: "none",
};

export function WhatsappPetugasManager({
  rows,
  profiles,
}: {
  rows: WhatsappPetugasRow[];
  profiles: ProfileOption[];
}) {
  const [values, setValues] = useState(emptyForm);
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(values.id);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await saveWhatsappPetugas(values);

      if (!result.ok) {
        toast.error("Gagal menyimpan nomor petugas", { description: result.message });
        return;
      }

      toast.success(result.message);
      setValues(emptyForm);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
      <div className="grid gap-3">
        {rows.length ? (
          rows.map((row) => (
            <WhatsappPetugasCard
              key={row.id}
              row={row}
              profile={profiles.find((profile) => profile.id === row.profile_id)}
              onEdit={() =>
                setValues({
                  id: row.id,
                  nama: row.nama ?? "",
                  phoneNumber: row.phone_number ?? "",
                  profileId: row.profile_id ?? "none",
                })
              }
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            Belum ada nomor WhatsApp petugas.
          </div>
        )}
      </div>

      <form className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        <div className="mb-5">
          <p className="text-sm font-semibold text-red-700">
            {isEditing ? "Edit nomor" : "Tambah nomor"}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Nomor WhatsApp Petugas
          </h2>
        </div>
        <div className="grid gap-4">
          <Field label="Nama petugas">
            <Input
              value={values.nama}
              onChange={(event) => setValues({ ...values, nama: event.target.value })}
              placeholder="Nama petugas"
              disabled={isPending}
              required
            />
          </Field>
          <Field label="Nomor WhatsApp">
            <Input
              value={values.phoneNumber}
              onChange={(event) => setValues({ ...values, phoneNumber: event.target.value })}
              placeholder="62812..."
              disabled={isPending}
              required
            />
          </Field>
          <Field label="Hubungkan ke profil">
            <Select
              value={values.profileId}
              onValueChange={(profileId) => setValues({ ...values, profileId })}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tidak dihubungkan</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name || profile.email || profile.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {isEditing ? (
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setValues(emptyForm)}>
              Batal
            </Button>
          ) : null}
          <Button type="submit" disabled={isPending}>
            {isEditing ? <Pencil /> : <Plus />}
            {isPending ? "Menyimpan..." : isEditing ? "Simpan perubahan" : "Tambah nomor"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function WhatsappPetugasCard({
  row,
  profile,
  onEdit,
}: {
  row: WhatsappPetugasRow;
  profile?: ProfileOption;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      const result = await setWhatsappPetugasActive(row.id, !row.is_active);

      if (!result.ok) {
        toast.error("Gagal mengubah status nomor", { description: result.message });
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-950">{row.nama || "Tanpa nama"}</h3>
            <Badge variant={row.is_active ? "secondary" : "outline"}>
              {row.is_active ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">{row.phone_number || "-"}</p>
          <p className="mt-2 text-xs text-slate-500">
            Profil: {profile?.full_name || profile?.email || "Tidak dihubungkan"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Pencil />
            Edit
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={toggleActive}>
            {row.is_active ? <PowerOff /> : <Power />}
            {row.is_active ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
