import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, ShieldCheck } from "lucide-react";
import { LogoutButton } from "@/app/admin/logout-button";
import { PetugasCatalogContent } from "@/components/petugas-catalog-content";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireStaffRole } from "@/lib/auth-guards";
import { fetchCatalogData } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function PetugasPage() {
  const auth = await requireStaffRole(["admin", "petugas"]);

  if (!auth.ok) {
    redirect("/login?redirectTo=/petugas&error=staff_required");
  }

  const { books, theses, error } = await fetchCatalogData();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-10">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
              <ShieldCheck className="size-4" />
              Akses {auth.role === "admin" ? "admin" : "petugas"}
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Panel Petugas Ruang Baca
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Petugas dapat menambah, mengedit, dan menghapus data buku serta skripsi.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {auth.role === "admin" ? (
              <Button asChild variant="outline" className="rounded-xl bg-white">
                <Link href="/admin">
                  <BookOpen />
                  Admin
                </Link>
              </Button>
            ) : null}
            <LogoutButton />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        {error ? (
          <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-950">
            <AlertTitle>Data Supabase belum dapat dimuat</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <PetugasCatalogContent books={books} theses={theses} />
      </section>
    </main>
  );
}
