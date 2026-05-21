"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  CheckCheck,
  ClipboardList,
  FileText,
  Home,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { LogoutButton } from "@/app/admin/logout-button";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { RoleProvider, useRole } from "@/components/role-provider";
import { RoleSwitcher } from "@/components/role-switcher";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const navItems: Array<{
  href: string;
  label: string;
  roleLabels?: Partial<Record<Role, string>>;
  icon: ComponentType<{ className?: string }>;
  group: "utama" | "manajemen";
  roles: Role[];
}> = [
  { href: "/dashboard", label: "Dasbor", icon: BarChart3, group: "utama", roles: ["admin", "dosen", "petugas"] },
  { href: "/petugas", label: "Panel Petugas", icon: BookOpen, group: "utama", roles: ["petugas"] },
  { href: "/dashboard/katalog", label: "Katalog", icon: BookOpen, group: "utama", roles: ["admin", "dosen", "petugas"] },
  { href: "/admin/peminjaman", label: "Peminjaman", icon: BookMarked, group: "utama", roles: ["admin", "dosen", "petugas"] },
  {
    href: "/dashboard/verifikasi",
    label: "Verifikasi",
    roleLabels: { dosen: "Data Skripsi" },
    icon: CheckCheck,
    group: "utama",
    roles: ["admin", "dosen"],
  },
  { href: "/dashboard/presensi", label: "Presensi", icon: ClipboardList, group: "utama", roles: ["admin", "dosen", "petugas"] },
  { href: "/dashboard/laporan", label: "Laporan", icon: FileText, group: "utama", roles: ["admin", "dosen"] },
  { href: "/dashboard/whatsapp", label: "Input WhatsApp", icon: MessageCircle, group: "manajemen", roles: ["admin", "petugas"] },
  { href: "/admin/submissions", label: "Kiriman WA", icon: MessageCircle, group: "manajemen", roles: ["admin"] },
  { href: "/admin/whatsapp-petugas", label: "Nomor WA", icon: Phone, group: "manajemen", roles: ["admin"] },
  { href: "/dashboard/profil", label: "Profil", icon: UserRound, group: "manajemen", roles: ["admin", "dosen", "petugas"] },
  { href: "/dashboard/pengguna", label: "Pengguna", icon: Users, group: "manajemen", roles: ["admin"] },
  { href: "/dashboard/permissions", label: "Matriks Akses", icon: ShieldCheck, group: "manajemen", roles: ["admin"] },
];

const pageTitles: Record<string, { title: string; breadcrumb: string }> = {
  "/dashboard": { title: "Dasbor", breadcrumb: "Internal / Dasbor" },
  "/petugas": { title: "Panel Petugas", breadcrumb: "Petugas / Katalog" },
  "/dashboard/katalog": { title: "Katalog Koleksi", breadcrumb: "Internal / Katalog" },
  "/admin/peminjaman": { title: "Peminjaman Koleksi", breadcrumb: "Manajemen / Peminjaman" },
  "/admin/loans": { title: "Peminjaman Koleksi", breadcrumb: "Manajemen / Peminjaman" },
  "/dashboard/verifikasi": { title: "Verifikasi Koleksi", breadcrumb: "Internal / Verifikasi" },
  "/dashboard/presensi": { title: "Data Kunjungan", breadcrumb: "Internal / Presensi" },
  "/dashboard/laporan": { title: "Laporan Pengunjung", breadcrumb: "Internal / Laporan" },
  "/dashboard/whatsapp": { title: "Input WhatsApp", breadcrumb: "Internal / Input WhatsApp" },
  "/admin/submissions": { title: "Kiriman WhatsApp", breadcrumb: "Manajemen / Kiriman WA" },
  "/admin/whatsapp-petugas": { title: "Nomor WhatsApp", breadcrumb: "Manajemen / Nomor WA" },
  "/dashboard/profil": { title: "Profil Akun", breadcrumb: "Internal / Profil" },
  "/dashboard/pengguna": { title: "Pengguna dan Peran", breadcrumb: "Internal / Pengguna" },
  "/dashboard/permissions": { title: "Matriks Hak Akses", breadcrumb: "Internal / Hak Akses" },
};

export function DashboardRoot({
  children,
  role,
  userDisplayName,
  userEmail,
}: {
  children: ReactNode;
  role: Role;
  userDisplayName: string;
  userEmail: string;
}) {
  return (
    <RoleProvider initialRole={role} userDisplayName={userDisplayName} userEmail={userEmail}>
      <DashboardShell>{children}</DashboardShell>
    </RoleProvider>
  );
}

function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const currentPage = pageTitles[pathname] ?? pageTitles["/dashboard"];

  return (
    <div className="min-h-screen bg-[#f5f8fa] lg:grid lg:grid-cols-[19rem_minmax(0,1fr)]">
      <aside className="hidden h-screen border-r border-slate-200/80 bg-white/95 p-4 shadow-sm backdrop-blur lg:sticky lg:top-0 lg:block">
        <SidebarContent />
      </aside>
      <div className="min-w-0 w-full">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 rounded-2xl bg-white lg:hidden">
                    <Menu />
                    <span className="sr-only">Buka menu</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="left-4 top-4 h-[calc(100vh-2rem)] max-w-80 translate-x-0 translate-y-0 rounded-2xl p-0">
                  <SidebarContent onNavigate={() => setOpen(false)} />
                </DialogContent>
              </Dialog>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-emerald-700">{currentPage.breadcrumb}</p>
                <h1 className="truncate text-xl font-semibold tracking-normal text-slate-950 sm:text-2xl">{currentPage.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RoleSwitcher />
              <LogoutButton className="hidden h-10 rounded-2xl px-3 shadow-sm sm:inline-flex" />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role, userDisplayName } = useRole();
  const visibleItems = navItems.filter((item) => item.roles.includes(role));
  const loanSummary = useLoanSummary(visibleItems.some((item) => item.href === "/admin/peminjaman"));

  return (
    <div className="flex h-full flex-col gap-6 rounded-[1.5rem] bg-white p-4 lg:p-0">
      <Link href="/" className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50" onClick={onNavigate}>
        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-700 text-primary-foreground shadow-sm shadow-emerald-950/15">
          <Home className="size-5" />
        </div>
        <div>
          <p className="font-bold leading-none text-slate-950">Ruang Baca</p>
          <p className="mt-1 text-xs text-slate-500">Pendidikan Matematika</p>
        </div>
      </Link>
      <nav className="grid gap-5">
        <NavGroup title="Menu Utama" items={visibleItems.filter((item) => item.group === "utama")} role={role} pathname={pathname} onNavigate={onNavigate} loanSummary={loanSummary} />
        <NavGroup title="Manajemen" items={visibleItems.filter((item) => item.group === "manajemen")} role={role} pathname={pathname} onNavigate={onNavigate} loanSummary={loanSummary} />
      </nav>
      <div className="mt-auto grid gap-3">
        <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Masuk sebagai</p>
          <p className="mt-1 truncate font-semibold text-slate-950">{userDisplayName}</p>
        </div>
        <div className="rounded-[1.35rem] border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-950">
          <p className="font-semibold">Dashboard internal</p>
          <p className="mt-1 leading-6 text-emerald-900/80">
            Akses mengikuti akun login dan tidak dapat diganti manual.
          </p>
        </div>
        <LogoutButton className="h-11 w-full justify-center rounded-2xl bg-white" />
      </div>
    </div>
  );
}

function NavGroup({
  title,
  items,
  role,
  pathname,
  onNavigate,
  loanSummary,
}: {
  title: string;
  items: typeof navItems;
  role: Role;
  pathname: string;
  onNavigate?: () => void;
  loanSummary?: { active: number; overdue: number };
}) {
  if (!items.length) return null;

  return (
    <div>
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <div className="grid gap-1.5">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          const label = item.roleLabels?.[role] ?? item.label;
          const showLoanBadge = item.href === "/admin/peminjaman" && loanSummary && loanSummary.active + loanSummary.overdue > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950",
                active && "bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-100",
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200",
                  active && "bg-emerald-700 text-white ring-emerald-700",
                )}
              >
                <Icon className="size-4" />
              </span>
              {label}
              {showLoanBadge ? (
                <span
                  className={cn(
                    "ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    loanSummary.overdue > 0
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700",
                  )}
                >
                  {loanSummary.overdue > 0 ? loanSummary.overdue : loanSummary.active}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function useLoanSummary(enabled: boolean) {
  const [summary, setSummary] = useState<{ active: number; overdue: number }>();

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    fetch("/api/loans/summary")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setSummary({
            active: Number(data.active) || 0,
            overdue: Number(data.overdue) || 0,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setSummary({ active: 0, overdue: 0 });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return summary;
}
