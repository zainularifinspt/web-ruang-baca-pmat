"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CheckCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  Menu,
  MessageCircle,
  Plus,
  QrCode,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { LogoutButton } from "@/app/admin/logout-button";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
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
  { href: "/dashboard/katalog", label: "Katalog", icon: BookOpen, group: "utama", roles: ["admin", "dosen", "petugas"] },
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
  { href: "/dashboard/profil", label: "Profil", icon: UserRound, group: "manajemen", roles: ["admin", "dosen", "petugas"] },
  { href: "/dashboard/pengguna", label: "Pengguna", icon: Users, group: "manajemen", roles: ["admin"] },
  { href: "/dashboard/permissions", label: "Matriks Akses", icon: ShieldCheck, group: "manajemen", roles: ["admin"] },
];

const pageTitles: Record<string, { title: string; breadcrumb: string }> = {
  "/dashboard": { title: "Dasbor", breadcrumb: "Internal / Dasbor" },
  "/dashboard/katalog": { title: "Katalog Koleksi", breadcrumb: "Internal / Katalog" },
  "/dashboard/verifikasi": { title: "Verifikasi Koleksi", breadcrumb: "Internal / Verifikasi" },
  "/dashboard/presensi": { title: "Data Kunjungan", breadcrumb: "Internal / Presensi" },
  "/dashboard/laporan": { title: "Laporan Pengunjung", breadcrumb: "Internal / Laporan" },
  "/dashboard/whatsapp": { title: "Input WhatsApp", breadcrumb: "Internal / Input WhatsApp" },
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
  const { role } = useRole();
  const currentPage = pageTitles[pathname] ?? pageTitles["/dashboard"];
  const primaryAction = useMemo(() => getPrimaryAction(role), [role]);
  const PrimaryActionIcon = primaryAction.icon;

  return (
    <div className="min-h-screen bg-[#f5f8fa]">
      <aside className="fixed inset-y-0 left-0 hidden w-[19rem] border-r border-slate-200/80 bg-white/95 p-4 shadow-sm backdrop-blur lg:block">
        <SidebarContent />
      </aside>
      <div className="w-full lg:pl-[19rem]">
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
              <Button asChild className="hidden rounded-2xl shadow-sm sm:inline-flex" size="sm">
                <Link href={primaryAction.href}>
                  <PrimaryActionIcon />
                  {primaryAction.label}
                </Link>
              </Button>
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
        <NavGroup title="Menu Utama" items={visibleItems.filter((item) => item.group === "utama")} role={role} pathname={pathname} onNavigate={onNavigate} />
        <NavGroup title="Manajemen" items={visibleItems.filter((item) => item.group === "manajemen")} role={role} pathname={pathname} onNavigate={onNavigate} />
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
}: {
  title: string;
  items: typeof navItems;
  role: Role;
  pathname: string;
  onNavigate?: () => void;
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
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function getPrimaryAction(role: Role) {
  if (role === "dosen") {
    return { href: "/dashboard/katalog", label: "Tambah Skripsi", icon: GraduationCap };
  }

  if (role === "petugas") {
    return { href: "/dashboard/presensi", label: "Bantu Presensi", icon: QrCode };
  }

  if (role === "mahasiswa") {
    return { href: "/katalog", label: "Buka Katalog", icon: BookOpen };
  }

  return { href: "/dashboard/katalog", label: "Tambah Koleksi", icon: Plus };
}
