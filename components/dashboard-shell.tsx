"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  ClipboardList,
  FileText,
  Menu,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { LogoutButton } from "@/app/admin/logout-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RoleProvider, useRole } from "@/components/role-provider";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const navItems: Array<{
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  group: "utama" | "manajemen";
  roles: Role[];
}> = [
  {
    href: "/dashboard",
    label: "Dasbor",
    icon: BarChart3,
    group: "utama",
    roles: ["admin", "dosen", "petugas"],
  },
  {
    href: "/dashboard/katalog",
    label: "Katalog Koleksi",
    icon: BookOpen,
    group: "utama",
    roles: ["admin", "dosen", "petugas"],
  },
  {
    href: "/dashboard/presensi",
    label: "Presensi",
    icon: ClipboardList,
    group: "utama",
    roles: ["admin", "dosen", "petugas"],
  },
  {
    href: "/dashboard/laporan",
    label: "Laporan",
    icon: FileText,
    group: "utama",
    roles: ["admin", "dosen"],
  },
  {
    href: "/dashboard/dokumen",
    label: "Dokumen Digital",
    icon: BookOpen,
    group: "manajemen",
    roles: ["admin"],
  },
  {
    href: "/dashboard/pengguna",
    label: "Pengguna",
    icon: Users,
    group: "manajemen",
    roles: ["admin"],
  },
  {
    href: "/dashboard/permissions",
    label: "Hak Akses",
    icon: ShieldCheck,
    group: "manajemen",
    roles: ["admin"],
  },
];
const pageTitles: Record<string, string> = {
  "/dashboard": "Dasbor",
  "/dashboard/katalog": "Katalog Koleksi",
  "/dashboard/presensi": "Presensi",
  "/dashboard/laporan": "Laporan",
  "/dashboard/pengguna": "Pengguna",
  "/dashboard/permissions": "Hak Akses",
  "/dashboard/profil": "Profil Akun",
  "/dashboard/dokumen": "Dokumen Digital",
  "/petugas": "Katalog Koleksi",
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
    <RoleProvider
      initialRole={role}
      userDisplayName={userDisplayName}
      userEmail={userEmail}
    >
      <DashboardShell>{children}</DashboardShell>
    </RoleProvider>
  );
}

function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { userDisplayName, roleLabel } = useRole();
  return (
    <div className="admin-app">
      <a href="#admin-main" className="admin-skip-link">
        Lewati ke konten
      </a>
      <aside className="admin-sidebar hidden xl:flex">
        <SidebarContent />
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="flex min-w-0 items-center gap-3">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl xl:hidden"
                  aria-label="Buka menu"
                >
                  <Menu />
                </Button>
              </DialogTrigger>
              <DialogContent className="admin-mobile-sidebar left-3 top-3 h-[calc(100dvh-1.5rem)] max-w-72 translate-x-0 translate-y-0 p-0">
                <DialogTitle className="sr-only">Menu Ruang Baca</DialogTitle>
                <SidebarContent onNavigate={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
            <span className="hidden text-sm text-slate-500 sm:inline">
              Ruang Baca
            </span>
            <ChevronRight className="hidden size-3.5 text-slate-400 sm:block" />
            <span className="truncate text-sm font-bold text-slate-800">
              {pageTitles[pathname] ?? "Dasbor"}
            </span>
          </div>
          <Link
            href="/dashboard/profil"
            className="admin-account"
            aria-label={`Profil ${userDisplayName}`}
          >
            <span className="hidden min-w-0 text-right sm:block">
              <span className="block max-w-44 truncate text-xs font-bold text-slate-800">
                {userDisplayName}
              </span>
              <span className="block text-[11px] text-slate-500">
                {roleLabel}
              </span>
            </span>
            <span className="admin-avatar">
              <UserRound className="size-4" />
            </span>
          </Link>
        </header>
        <main id="admin-main" className="admin-main" tabIndex={-1}>
          {children}
        </main>
        <footer className="admin-footer">
          <span>Ruang Baca PMat</span>
          <span>Pendidikan Matematika · FKIP ULM</span>
        </footer>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role, roleLabel, userDisplayName } = useRole();
  const visibleItems = navItems.filter((item) => item.roles.includes(role));
  return (
    <div className="admin-sidebar-content">
      <Link href="/dashboard" className="admin-brand" onClick={onNavigate}>
        <span className="admin-brand-logo">
          <Image
            src="/ulm-logo.png"
            alt="Logo ULM"
            width={36}
            height={36}
            priority
          />
        </span>
        <span>
          <span className="block text-base font-extrabold tracking-tight">
            Ruang Baca<span className="text-rose-300">.</span>
          </span>
          <span className="mt-0.5 block text-[11px] text-rose-100/75">
            Pendidikan Matematika
          </span>
        </span>
      </Link>
      <nav aria-label="Navigasi dashboard" className="mt-9 space-y-7">
        {(
          [
            ["utama", "Ruang kerja"],
            ["manajemen", "Manajemen"],
          ] as const
        ).map(([group, label]) => {
          const items = visibleItems.filter((item) => item.group === group);
          if (!items.length) return null;
          return (
            <div key={group}>
              <p className="mb-3 px-3 text-[11px] font-semibold text-rose-100/65">
                {label}
              </p>
              <div className="space-y-1.5">
                {items.map(({ href, label, icon: Icon }) => {
                  const active =
                    pathname === href ||
                    (pathname === "/petugas" && href === "/dashboard/katalog");
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn("admin-nav-link", active && "is-active")}
                    >
                      <Icon className="size-[18px]" />
                      <span>{label}</span>
                      {active && <ChevronRight className="ml-auto size-3.5" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="admin-sidebar-bottom">
        <Link href="/" onClick={onNavigate} className="admin-public-link">
          <BookOpen className="size-4" />
          <span>Lihat Website</span>
          <ArrowUpRight className="ml-auto size-4" />
        </Link>
        <Link
          href="/dashboard/profil"
          onClick={onNavigate}
          className="flex items-center gap-3 py-4"
        >
          <span className="admin-avatar">
            <UserRound className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-bold">
              {userDisplayName}
            </span>
            <span className="mt-0.5 block text-[11px] text-rose-100/70">
              {roleLabel}
            </span>
          </span>
        </Link>
        <LogoutButton className="admin-logout h-10 w-full justify-start rounded-xl" />
      </div>
    </div>
  );
}
