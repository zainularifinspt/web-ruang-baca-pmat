import Link from "next/link";
import { Suspense } from "react";
import { BookOpenCheck } from "lucide-react";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d1fae5,transparent_32%),linear-gradient(135deg,#f8fafc_0%,#eef6f4_52%,#e0f2fe_100%)] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-2xl shadow-slate-200/80 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                <BookOpenCheck className="size-5" />
              </span>
              <span>
                <span className="block font-semibold leading-none">Ruang Baca</span>
                <span className="mt-1 block text-xs text-slate-300">Pendidikan Matematika</span>
              </span>
            </Link>

            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-300">
                Admin Access
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight">
                Kelola katalog dan aktivitas ruang baca dengan aman.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                Masuk memakai akun Supabase yang memiliki role admin di tabel profiles.
              </p>
            </div>
          </section>

          <section className="p-6 sm:p-10">
            <div className="mx-auto flex max-w-md flex-col justify-center py-8 lg:min-h-[34rem]">
              <div className="mb-8 lg:hidden">
                <Link href="/" className="inline-flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <BookOpenCheck className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold leading-none text-slate-950">Ruang Baca</span>
                    <span className="mt-1 block text-xs text-slate-500">Pendidikan Matematika</span>
                  </span>
                </Link>
              </div>

              <div className="mb-8">
                <p className="text-sm font-medium text-emerald-700">Login Admin</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  Selamat datang kembali
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Gunakan email dan password yang terdaftar di Supabase Auth.
                </p>
              </div>

              <Suspense>
                <LoginForm />
              </Suspense>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
