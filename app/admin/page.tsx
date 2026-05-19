import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import { LogoutButton } from "@/app/admin/logout-button";
import { Button } from "@/components/ui/button";
import { hasValidSupabaseConfig } from "@/lib/supabase-config";
import { createSupabaseServerClient } from "@/lib/supabase-auth-server";

export const dynamic = "force-dynamic";

const adminLinks = [
  {
    href: "/dashboard",
    title: "Dashboard",
    description: "Ringkasan operasional ruang baca.",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/katalog",
    title: "Katalog",
    description: "Kelola buku dan skripsi.",
    icon: BookOpen,
  },
  {
    href: "/dashboard/presensi",
    title: "Presensi",
    description: "Pantau data kunjungan.",
    icon: ClipboardList,
  },
  {
    href: "/dashboard/pengguna",
    title: "Pengguna",
    description: "Lihat manajemen pengguna.",
    icon: Users,
  },
];

export default async function AdminPage() {
  if (!hasValidSupabaseConfig()) {
    redirect("/login?redirectTo=/admin&error=configuration");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/login?redirectTo=/admin&error=admin_required");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-10">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
              <ShieldCheck className="size-4" />
              Admin terverifikasi
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Panel Admin Ruang Baca
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Session aktif untuk {user.email}. Akses halaman ini dilindungi middleware dan role dari tabel profiles.
            </p>
          </div>
          <LogoutButton />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {adminLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon className="size-5" />
                  </span>
                  <ArrowUpRight className="size-4 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-700" />
                </div>
                <h2 className="mt-5 text-lg font-semibold text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900">
          Pastikan tabel <span className="font-semibold">profiles</span> memiliki baris dengan id yang sama seperti user Supabase Auth dan kolom role bernilai <span className="font-semibold">admin</span>.
        </div>

        <div className="mt-8">
          <Button asChild className="rounded-xl">
            <Link href="/dashboard">
              <LayoutDashboard />
              Buka Dashboard
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
