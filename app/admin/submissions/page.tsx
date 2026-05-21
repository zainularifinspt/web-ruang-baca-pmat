import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Inbox, ShieldCheck } from "lucide-react";
import { LogoutButton } from "@/app/admin/logout-button";
import {
  SubmissionsManager,
  type SenderProfile,
  type SubmissionRow,
} from "@/app/admin/submissions/submissions-manager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader
        title="Verifikasi Kiriman WhatsApp"
        description="Tinjau, edit, approve, atau reject data buku dan skripsi sebelum tampil di katalog."
      />
      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
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
