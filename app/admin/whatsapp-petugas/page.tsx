import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageCircle, ShieldCheck } from "lucide-react";
import { LogoutButton } from "@/app/admin/logout-button";
import {
  WhatsappPetugasManager,
  type ProfileOption,
  type WhatsappPetugasRow,
} from "@/app/admin/whatsapp-petugas/whatsapp-petugas-manager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { requireStaffRole } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function WhatsappPetugasPage() {
  const auth = await requireStaffRole(["admin"]);

  if (!auth.ok) {
    redirect("/login?redirectTo=/admin/whatsapp-petugas&error=admin_required");
  }

  const { rows, profiles, error } = await fetchWhatsappPetugasData();

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader
        title="Nomor WhatsApp Petugas"
        description="Daftarkan nomor WhatsApp yang boleh mengirim data buku dan skripsi ke antrean verifikasi."
      />
      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <MessageCircle className="size-5" />
            </span>
            <div>
              <p className="text-sm text-slate-500">Nomor aktif</p>
              <p className="text-2xl font-bold text-slate-950">
                {rows.filter((row) => row.is_active).length}
              </p>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-950">
            <AlertTitle>Data belum dapat dimuat</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <WhatsappPetugasManager rows={rows} profiles={profiles} />
      </section>
    </main>
  );
}

function AdminHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-10">
        <div>
          <Button asChild variant="outline" size="sm" className="mb-5 rounded-xl bg-white">
            <Link href="/dashboard">
              <ArrowLeft />
              Kembali ke dashboard
            </Link>
          </Button>
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
            <ShieldCheck className="size-4" />
            Admin only
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
        <LogoutButton />
      </div>
    </section>
  );
}

async function fetchWhatsappPetugasData() {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const [{ data: rows, error: rowsError }, { data: profiles, error: profilesError }] =
      await Promise.all([
        supabaseAdmin
          .from("whatsapp_petugas")
          .select("id,profile_id,nama,phone_number,is_active,created_at")
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("profiles")
          .select("id,full_name,email,role")
          .in("role", ["admin", "petugas", "dosen"])
          .order("full_name", { ascending: true }),
      ]);

    if (rowsError) return { rows: [] as WhatsappPetugasRow[], profiles: [] as ProfileOption[], error: rowsError.message };
    if (profilesError) return { rows: (rows ?? []) as WhatsappPetugasRow[], profiles: [] as ProfileOption[], error: profilesError.message };

    return {
      rows: (rows ?? []) as WhatsappPetugasRow[],
      profiles: (profiles ?? []) as ProfileOption[],
      error: undefined,
    };
  } catch (error) {
    return {
      rows: [] as WhatsappPetugasRow[],
      profiles: [] as ProfileOption[],
      error: error instanceof Error ? error.message : "Gagal memuat data WhatsApp petugas.",
    };
  }
}
