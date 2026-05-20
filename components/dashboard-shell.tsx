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
  Users,
} from "lucide-react";
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
  "/dashboard/pengguna": { title: "Pengguna dan Peran", breadcrumb: "Internal / Pengguna" },
  "/dashboard/permissions": { title: "Matriks Hak Akses", breadcrumb: "Internal / Hak Akses" },
};

export function DashboardRoot({
  children,
  role,
}: {
  children: ReactNode;
  role: Role;
}) {
  return (
    <RoleProvider initialRole={role}>
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
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-[19rem] border-r border-slate-200/80 bg-white p-4 shadow-sm lg:block">
        <SidebarContent />
      </aside>
      <div className="w-full lg:pl-[19rem]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="mx-auto flex min-h-20 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 rounded-xl bg-white lg:hidden">
                    <Menu />
                    <span className="sr-only">Buka menu</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="left-4 top-4 h-[calc(100vh-2rem)] max-w-80 translate-x-0 translate-y-0 rounded-2xl p-0">
                  <SidebarContent onNavigate={() => setOpen(false)} />
                </DialogContent>
              </Dialog>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-500">{currentPage.breadcrumb}</p>
                <h1 className="truncate text-lg font-bold text-slate-950 sm:text-xl">{currentPage.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild className="hidden rounded-xl sm:inline-flex" size="sm">
                <Link href={primaryAction.href}>
                  <PrimaryActionIcon />
                  {primaryAction.label}
                </Link>
              </Button>
              <RoleSwitcher />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role } = useRole();
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="flex h-full flex-col gap-6 p-4 lg:p-0">
      <Link href="/" className="flex items-center gap-3" onClick={onNavigate}>
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-primary-foreground shadow-sm">
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
      <div className="grid gap-1">
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
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950",
                active && "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100",
              )}
            >
              <Icon className="size-4" />
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
