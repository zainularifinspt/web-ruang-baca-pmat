import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck, UserRound, Users } from "lucide-react";
import { LogoutButton } from "@/app/admin/logout-button";
import { PetugasForm } from "@/app/admin/petugas/petugas-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStaffRole } from "@/lib/auth-guards";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type PetugasProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string | null;
};

export default async function AdminPetugasPage() {
  const auth = await requireStaffRole(["admin"]);

  if (!auth.ok) {
    redirect(`/login?redirectTo=/admin/petugas&error=admin_required`);
  }

  const { profiles, error } = await fetchPetugasProfiles();

  return (
    <main className="min-h-screen bg-slate-50">
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
              Akun Petugas Ruang Baca
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Buat akun petugas untuk mengelola koleksi buku dan skripsi tanpa akses manajemen akun.
            </p>
          </div>
          <LogoutButton />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-10">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Tambah Petugas</CardTitle>
          </CardHeader>
          <CardContent>
            <PetugasForm />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Users className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-slate-500">Total petugas</p>
                  <p className="text-2xl font-bold text-slate-950">{profiles.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {error ? (
            <Alert className="border-amber-200 bg-amber-50 text-amber-950">
              <AlertTitle>Daftar petugas belum dapat dimuat</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-3">
            {profiles.map((profile) => (
              <div key={profile.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <UserRound className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">
                      {profile.full_name ?? "Tanpa nama"}
                    </p>
                    <p className="truncate text-sm text-slate-500">{profile.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

async function fetchPetugasProfiles() {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id,email,full_name,created_at")
      .eq("role", "petugas")
      .order("created_at", { ascending: false });

    if (error) {
      return { profiles: [] as PetugasProfile[], error: error.message };
    }

    return { profiles: (data ?? []) as PetugasProfile[], error: undefined };
  } catch (error) {
    return {
      profiles: [] as PetugasProfile[],
      error: error instanceof Error ? error.message : "Gagal memuat data petugas.",
    };
  }
}
