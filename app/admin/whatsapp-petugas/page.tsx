import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import {
  WhatsappPetugasManager,
  type ProfileOption,
  type WhatsappPetugasRow,
} from "@/app/admin/whatsapp-petugas/whatsapp-petugas-manager";
import { DashboardRoot } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  const currentProfile = profiles.find((profile) => profile.id === auth.user.id);
  const metadata = auth.user.user_metadata ?? {};
  const userDisplayName =
    currentProfile?.full_name ??
    (typeof metadata.full_name === "string" ? metadata.full_name : undefined) ??
    (typeof metadata.name === "string" ? metadata.name : undefined) ??
    auth.user.email ??
    "Pengguna";
  const userEmail = currentProfile?.email ?? auth.user.email ?? "";

  return (
    <DashboardRoot role={auth.role} userDisplayName={userDisplayName} userEmail={userEmail}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin only"
          title="Nomor WhatsApp Petugas"
          description="Daftarkan nomor WhatsApp yang boleh mengirim data buku dan skripsi ke antrean verifikasi."
        />

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
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
      </div>
    </DashboardRoot>
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
