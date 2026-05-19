"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Clock3,
  LayoutDashboard,
  ScanLine,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PublicNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-300",
        scrolled
          ? "border-slate-200 bg-white shadow-sm"
          : "border-transparent bg-white/95",
      )}
    >
      <div className="mx-auto flex min-h-18 max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-primary-foreground shadow-sm transition group-hover:scale-105 sm:size-11">
            <BookOpen className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold leading-none text-slate-950">Ruang Baca PMat</p>
            <p className="mt-1 truncate text-xs text-slate-500">Pendidikan Matematika</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-3 md:flex">
          <NavLink href="/katalog?tab=books" icon={Search} label="Katalog" />
          <NavLink href="/presensi" icon={ScanLine} label="Presensi" />
          <div className="mx-1 h-6 w-px bg-slate-200" />
          <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 lg:flex">
            <Clock3 className="size-3.5 text-emerald-600" />
            08.00-16.00
          </div>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/dashboard">
              <LayoutDashboard />
              Dasbor
            </Link>
          </Button>
        </nav>
        <div className="flex items-center gap-1.5 md:hidden">
          <MobileIconLink href="/katalog?tab=books" label="Katalog" icon={Search} />
          <MobileIconLink href="/presensi" label="Presensi" icon={ScanLine} />
          <MobileIconLink href="/dashboard" label="Dasbor" icon={LayoutDashboard} />
        </div>
      </div>
    </header>
  );
}

function MobileIconLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Button asChild variant="outline" size="icon" className="size-10 rounded-full bg-white">
      <Link href={href}>
        <Icon />
        <span className="sr-only">{label}</span>
      </Link>
    </Button>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group relative inline-flex items-center gap-2 rounded-full px-2.5 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
    >
      <Icon className="size-4 text-emerald-600 transition group-hover:-translate-y-0.5" />
      {label}
      <span className="absolute inset-x-3 -bottom-0.5 h-0.5 scale-x-0 rounded-full bg-emerald-600 transition-transform duration-300 group-hover:scale-x-100" />
    </Link>
  );
}
