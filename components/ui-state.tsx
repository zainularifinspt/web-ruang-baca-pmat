"use client";

import Link from "next/link";
import { AlertTriangle, Home, Loader2, RefreshCw } from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoadingScreen({
  label = "Memuat data ruang baca...",
  withNav = true,
}: {
  label?: string;
  withNav?: boolean;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {withNav ? <PublicNav /> : null}
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center px-4 py-10">
        <div className="text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-[1.35rem] bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100">
            <Loader2 className="size-7 animate-spin" />
          </div>
          <p className="mt-5 text-sm font-semibold text-slate-950">{label}</p>
          <p className="mt-2 text-sm text-slate-500">Sebentar, koleksi sedang disiapkan.</p>
        </div>
      </main>
    </div>
  );
}

export function CatalogPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <SkeletonBlock className="h-40 rounded-2xl" />
        <SkeletonBlock className="h-44 rounded-[1.75rem]" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </main>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-44 rounded-[2rem]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <SkeletonBlock className="h-96 rounded-2xl" />
        <SkeletonBlock className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <SkeletonBlock className="h-8 w-44 rounded-full" />
          <SkeletonBlock className="mt-5 h-10 max-w-xl rounded-xl" />
          <SkeletonBlock className="mt-3 h-5 max-w-2xl rounded-lg" />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-44 rounded-2xl" />
          ))}
        </div>
      </section>
    </main>
  );
}

export function ErrorState({
  title = "Halaman belum dapat dimuat",
  description = "Terjadi gangguan saat memuat data. Coba muat ulang halaman.",
  reset,
  homeHref = "/",
  className,
}: {
  title?: string;
  description?: string;
  reset?: () => void;
  homeHref?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[2rem] border border-rose-100 bg-white p-6 text-center shadow-xl shadow-slate-200/60 sm:p-10", className)}>
      <div className="mx-auto flex size-16 items-center justify-center rounded-[1.35rem] bg-rose-50 text-rose-700 ring-1 ring-rose-100">
        <AlertTriangle className="size-7" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-7 flex flex-col-reverse justify-center gap-2 sm:flex-row">
        <Button asChild variant="outline" className="rounded-2xl bg-white">
          <Link href={homeHref}>
            <Home />
            Ke beranda
          </Link>
        </Button>
        {reset ? (
          <Button type="button" className="rounded-2xl" onClick={reset}>
            <RefreshCw />
            Coba lagi
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ErrorScreen({
  title,
  description,
  reset,
  withNav = true,
}: {
  title?: string;
  description?: string;
  reset?: () => void;
  withNav?: boolean;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {withNav ? <PublicNav /> : null}
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center px-4 py-10 sm:px-6">
        <ErrorState title={title} description={description} reset={reset} className="w-full" />
      </main>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-slate-200">
      <SkeletonBlock className="h-36 rounded-none" />
      <div className="space-y-3 p-5">
        <SkeletonBlock className="h-5 w-24 rounded-full" />
        <SkeletonBlock className="h-5 rounded-lg" />
        <SkeletonBlock className="h-5 w-4/5 rounded-lg" />
        <SkeletonBlock className="h-16 rounded-2xl" />
      </div>
    </div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[linear-gradient(90deg,#e2e8f0_0%,#f8fafc_50%,#e2e8f0_100%)] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}
