import { redirect } from "next/navigation";
import { BookMarked } from "lucide-react";
import { DashboardRoot } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { LoansManager } from "@/app/admin/peminjaman/loans-manager";
import { requireStaffRole } from "@/lib/auth-guards";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { fetchLoansPageData } from "@/lib/loans";

export const dynamic = "force-dynamic";

export default async function LoansPage() {
  const auth = await requireStaffRole(["admin", "petugas"]);

  if (!auth.ok) {
    redirect("/login?redirectTo=/admin/peminjaman&error=staff_required");
  }

  const [profileResult, data] = await Promise.all([
    createSupabaseAdminClient()
      .from("profiles")
      .select("email,full_name")
      .eq("id", auth.user.id)
      .maybeSingle(),
    fetchLoansPageData(),
  ]);
  const metadata = auth.user.user_metadata ?? {};
  const userDisplayName =
    profileResult.data?.full_name ??
    (typeof metadata.full_name === "string" ? metadata.full_name : undefined) ??
    (typeof metadata.name === "string" ? metadata.name : undefined) ??
    auth.user.email ??
    "Pengguna";
  const userEmail = profileResult.data?.email ?? auth.user.email ?? "";

  return (
    <DashboardRoot role={auth.role} userDisplayName={userDisplayName} userEmail={userEmail}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Manajemen"
          title="Peminjaman Koleksi"
          description="Catat peminjaman buku dan skripsi, pantau pengembalian, dan kirim pengingat WhatsApp otomatis."
        />

        <div className="grid gap-4 sm:grid-cols-4">
          <Metric label="Aktif" value={data.activeCount} tone="emerald" />
          <Metric label="Terlambat" value={data.overdueCount} tone="rose" />
          <Metric label="Dikembalikan" value={data.returnedCount} tone="slate" />
          <Metric label="Dibatalkan" value={data.cancelledCount} tone="amber" />
        </div>

        {data.error ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-950">
            <AlertTitle>Data peminjaman belum dapat dimuat penuh</AlertTitle>
            <AlertDescription>{data.error}</AlertDescription>
          </Alert>
        ) : null}

        <SectionCard>
          <LoansManager
            loans={data.loans}
            availableBooks={data.availableBooks}
            availableTheses={data.availableTheses}
          />
        </SectionCard>
      </div>
    </DashboardRoot>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "rose" | "slate" | "amber";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <span className={`flex size-12 items-center justify-center rounded-2xl border ${tones[tone]}`}>
          <BookMarked className="size-5" />
        </span>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-950">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
