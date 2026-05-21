import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, BookOpenCheck, ShieldCheck, Sparkles } from "lucide-react";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-cyan-50 to-emerald-50 px-4 py-8 text-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-cyan-200 opacity-45 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-20 size-96 rounded-full bg-violet-200 opacity-35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 size-80 rounded-full bg-emerald-200 opacity-35 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:44px_44px] opacity-45" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/80 bg-white/80 shadow-2xl shadow-slate-950/10 backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
          <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-cyan-400 opacity-25 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 size-72 rounded-full bg-emerald-400 opacity-20 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:36px_36px] opacity-35" />

            <Link href="/" className="relative inline-flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-950/30">
                <BookOpenCheck className="size-5" />
              </span>
              <span>
                <span className="block font-semibold leading-none">Ruang Baca</span>
                <span className="mt-1 block text-xs text-slate-300">Pendidikan Matematika</span>
              </span>
            </Link>

            <div className="relative">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 backdrop-blur">
                <Sparkles className="size-3.5" />
                Ruang Baca Digital
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Akses Dashboard
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight">
                Kelola katalog dan aktivitas ruang baca dengan aman.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                Masuk untuk mengelola koleksi buku, skripsi, presensi, dan layanan akademik
                Jurusan Pendidikan Matematika.
              </p>
            </div>

            <div className="relative rounded-3xl border border-white/10 bg-white/10 p-4 text-sm leading-6 text-slate-300 backdrop-blur">
              <ShieldCheck className="mb-3 size-5 text-emerald-300" />
              Akses mengikuti role pengguna yang sudah terdaftar di sistem.
            </div>
          </section>

          <section className="bg-white/70 p-6 backdrop-blur-sm sm:p-10">
            <div className="mx-auto flex max-w-md flex-col justify-center py-8 lg:min-h-[34rem]">
              <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
                <Link href="/" className="inline-flex min-w-0 items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 via-cyan-600 to-violet-600 text-white shadow-lg shadow-emerald-950/15">
                    <BookOpenCheck className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold leading-none text-slate-950">Ruang Baca</span>
                    <span className="mt-1 block text-xs text-slate-500">Pendidikan Matematika</span>
                  </span>
                </Link>
              </div>

              <div className="mb-8">
                <Link
                  href="/"
                  className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
                >
                  <ArrowLeft className="size-3.5" />
                  Kembali ke beranda
                </Link>
                <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  <Sparkles className="size-3.5" />
                  Login Ruang Baca
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Selamat datang kembali
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Gunakan email dan password yang terdaftar untuk masuk ke dashboard sesuai role akun.
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
