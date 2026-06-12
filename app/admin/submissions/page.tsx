import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import {
  SubmissionsManager,
  type SenderProfile,
  type SubmissionRow,
} from "@/app/admin/submissions/submissions-manager";
import { DashboardRoot } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { requireStaffRole } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const auth = await requireStaffRole(["admin"]);

  if (!auth.ok) {
    redirect("/login?redirectTo=/admin/submissions&error=admin_required");
  }

  const { submissions, profilesById, petugasByPhone, error } = await fetchSubmissionsData();
  const currentProfile = profilesById[auth.user.id];
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
          title="Kiriman WhatsApp"
          description="Pantau kiriman WhatsApp dan perbaiki data parsing sebelum diproses di antrean verifikasi."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="Pending" value={submissions.filter((item) => item.status === "pending").length} />
          <Metric label="Approved" value={submissions.filter((item) => item.status === "approved").length} />
          <Metric label="Rejected" value={submissions.filter((item) => item.status === "rejected").length} />
        </div>

        {error ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-950">
            <AlertTitle>Submission belum dapat dimuat</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <SubmissionsManager
          submissions={submissions}
          profilesById={profilesById}
          petugasByPhone={petugasByPhone}
        />
      </div>
    </DashboardRoot>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
          <Inbox className="size-5" />
        </span>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-950">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

async function fetchSubmissionsData() {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const [
      { data: submissions, error: submissionsError },
      { data: profiles, error: profilesError },
      { data: petugasRows, error: petugasError },
    ] = await Promise.all([
      supabaseAdmin
        .from("draft_submissions")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("profiles").select("id,full_name,email"),
      supabaseAdmin.from("whatsapp_petugas").select("nama,phone_number,profile_id"),
    ]);

    if (submissionsError) return emptyResult(submissionsError.message);
    if (profilesError) return emptyResult(profilesError.message);
    if (petugasError) return emptyResult(petugasError.message);

    const profilesById = Object.fromEntries(
      ((profiles ?? []) as SenderProfile[]).map((profile) => [profile.id, profile]),
    );
    const petugasByPhone = Object.fromEntries(
      ((petugasRows ?? []) as Array<{ nama: string | null; phone_number: string | null; profile_id: string | null }>)
        .filter((row) => row.phone_number)
        .map((row) => [row.phone_number as string, { nama: row.nama, profile_id: row.profile_id }]),
    );

    return {
      submissions: (submissions ?? []) as SubmissionRow[],
      profilesById,
      petugasByPhone,
      error: undefined,
    };
  } catch (error) {
    return emptyResult(error instanceof Error ? error.message : "Gagal memuat submission.");
  }
}

function emptyResult(error: string) {
  return {
    submissions: [] as SubmissionRow[],
    profilesById: {} as Record<string, SenderProfile>,
    petugasByPhone: {} as Record<string, { nama: string | null; profile_id: string | null }>,
    error,
  };
}
