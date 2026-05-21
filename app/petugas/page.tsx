import { redirect } from "next/navigation";
import { DashboardRoot } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { PetugasCatalogContent } from "@/components/petugas-catalog-content";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { requireStaffRole } from "@/lib/auth-guards";
import { fetchCatalogData } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function PetugasPage() {
  const auth = await requireStaffRole(["admin", "petugas"]);

  if (!auth.ok) {
    redirect("/login?redirectTo=/petugas&error=staff_required");
  }

  const { books, theses, error } = await fetchCatalogData();
  const { data: profile } = await createSupabaseAdminClient()
    .from("profiles")
    .select("email,full_name")
    .eq("id", auth.user.id)
    .maybeSingle();
  const metadata = auth.user.user_metadata ?? {};
  const userDisplayName =
    profile?.full_name ??
    (typeof metadata.full_name === "string" ? metadata.full_name : undefined) ??
    (typeof metadata.name === "string" ? metadata.name : undefined) ??
    auth.user.email ??
    "Pengguna";
  const userEmail = profile?.email ?? auth.user.email ?? "";

  return (
    <DashboardRoot role={auth.role} userDisplayName={userDisplayName} userEmail={userEmail}>
      <div className="space-y-6">
        <PageHeader
          eyebrow={`Akses ${auth.role === "admin" ? "admin" : "petugas"}`}
          title="Panel Petugas Ruang Baca"
          description="Petugas dapat menambah, mengedit, dan menghapus data buku serta skripsi."
        />
        {error ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-950">
            <AlertTitle>Data Supabase belum dapat dimuat</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <PetugasCatalogContent books={books} theses={theses} />
      </div>
    </DashboardRoot>
  );
}
