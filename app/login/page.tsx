import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { ArrowLeft, BookOpenCheck, ShieldCheck, Sparkles } from "lucide-react";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-cyan-50/30 to-emerald-50/20 px-4 py-8 text-slate-950">
      {/* Background orbs from landing page backdrop */}
      <div className="animate-drift-slow pointer-events-none absolute -left-20 top-[-10%] size-[35rem] rounded-full bg-gradient-to-tr from-cyan-400/8 via-teal-400/6 to-transparent blur-[80px]" />
      <div className="animate-drift-reverse pointer-events-none absolute -right-20 top-[10%] size-[40rem] rounded-full bg-gradient-to-br from-indigo-400/8 via-purple-400/6 to-transparent blur-[100px]" />
      <div className="animate-drift-slow pointer-events-none absolute left-[20%] top-[40%] size-[30rem] rounded-full bg-gradient-to-tr from-emerald-400/4 via-cyan-400/4 to-transparent blur-[90px]" />

      {/* Decorative math glyphs */}
      <div className="pointer-events-none absolute left-[5%] top-28 hidden select-none text-[11rem] font-light leading-none text-emerald-600/[0.03] lg:block">
        ∫
      </div>
      <div className="pointer-events-none absolute right-[8%] top-24 hidden select-none text-7xl font-semibold text-sky-600/[0.04] lg:block">
        Σ
      </div>
      <div className="pointer-events-none absolute bottom-28 left-[12%] hidden select-none text-3xl italic text-emerald-600/[0.04] lg:block">
        A = πr²
      </div>
      <div className="pointer-events-none absolute bottom-24 right-[12%] hidden select-none text-3xl italic text-indigo-600/[0.04] lg:block">
        f(x) = x² - 4x + 3
      </div>

      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.02)_1px,transparent_1px)] bg-[size:44px_44px] opacity-45" />

      <div className="relative flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2.25rem] border border-white/40 bg-white/45 shadow-2xl shadow-slate-950/5 backdrop-blur-3xl lg:grid-cols-[0.92fr_1.08fr]">
          <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#0c1424] via-[#090d16] to-[#030712] p-12 text-white lg:flex lg:flex-col lg:justify-between border-r border-white/5">
            {/* Glowing background circles with drift animations inside card */}
            <div className="animate-drift-slow pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-gradient-to-br from-cyan-500/15 via-blue-500/5 to-transparent blur-3xl" />
            <div className="animate-drift-reverse pointer-events-none absolute bottom-[-10%] left-[-10%] size-80 rounded-full bg-gradient-to-tr from-emerald-500/15 via-cyan-500/5 to-transparent blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:36px_36px] opacity-40" />

            <Link href="/" className="group relative inline-flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]">
              <span className="flex items-center -space-x-2">
                <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-950/45 transition-transform duration-300 group-hover:scale-105">
                  <BookOpenCheck className="size-5.5" />
                </span>
                <span className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white shadow-md">
                  <Image src="/ulm-logo.png" alt="Logo Universitas Lambung Mangkurat" width={32} height={32} className="size-8 object-contain" priority />
                </span>
              </span>
              <div>
                <span className="block font-bold leading-none tracking-tight text-white">Ruang Baca</span>
                <span className="mt-1 block text-[10px] font-medium text-slate-400">Pendidikan Matematika</span>
              </div>
            </Link>

            <div className="relative my-auto py-8">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-cyan-200 backdrop-blur-md shadow-xs">
                <Sparkles className="size-3.5 text-cyan-400 animate-pulse" />
                Ruang Baca Digital
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                Akses Dashboard
              </p>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight text-white tracking-tight sm:text-4xl">
                Kelola katalog dan aktivitas ruang baca dengan aman.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
                Masuk untuk mengelola koleksi buku, skripsi, presensi, dan layanan akademik
                Jurusan Pendidikan Matematika.
              </p>
            </div>

            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-slate-300 backdrop-blur-md shadow-inner shadow-white/5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5 shrink-0 text-emerald-400" />
                <span className="font-semibold text-white/90">Akses Terenkripsi</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 leading-normal">
                Akses dashboard disesuaikan dengan peran (role) pengguna yang telah terdaftar di sistem.
              </p>
            </div>
          </section>

          <section className="relative bg-white/55 p-6 backdrop-blur-3xl sm:p-12 flex flex-col justify-center">
            <div className="mx-auto flex w-full max-w-md flex-col justify-center py-6">
              {/* Mobile Logo Header */}
              <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
                <Link href="/" className="inline-flex min-w-0 items-center gap-3">
                  <span className="flex shrink-0 items-center -space-x-2">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-600 to-indigo-600 text-white shadow-md">
                      <BookOpenCheck className="size-5" />
                    </span>
                    <span className="flex size-9 items-center justify-center rounded-full border border-slate-200/80 bg-white shadow-xs">
                      <Image src="/ulm-logo.png" alt="Logo Universitas Lambung Mangkurat" width={22} height={22} className="size-7 object-contain" />
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold leading-none text-slate-900 tracking-tight">Ruang Baca</span>
                    <span className="mt-1 block text-[10px] font-medium text-slate-500">Pendidikan Matematika</span>
                  </span>
                </Link>
              </div>

              {/* Kembali ke beranda pill */}
              <div className="mb-6 flex">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-250/80 bg-white/70 px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700 hover:bg-white hover:shadow-md hover:shadow-cyan-500/5 group"
                >
                  <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5 text-slate-400 group-hover:text-cyan-600" />
                  Kembali ke beranda
                </Link>
              </div>

              <div className="mb-8">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-500/10 shadow-xs">
                  <Sparkles className="size-3.5 text-emerald-600 animate-pulse" />
                  Portal Autentikasi
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  Selamat datang kembali
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Gunakan email dan password terdaftar Anda untuk masuk ke sistem dashboard sesuai role.
                </p>
              </div>

              <Suspense fallback={
                <div className="flex h-32 items-center justify-center">
                  <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
                </div>
              }>
                <LoginForm />
              </Suspense>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
