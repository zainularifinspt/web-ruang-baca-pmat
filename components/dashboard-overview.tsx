"use client";

import Link from "next/link";
import { useMemo, type ComponentType } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  FileDown,
  GraduationCap,
  Plus,
  ScanLine,
  Users,
} from "lucide-react";
import { AdminPageHeading } from "@/components/admin-page-heading";
import {
  AddBookDialog,
  AddThesisDialog,
} from "@/components/catalog-crud-dialogs";
import { CollectionDetail } from "@/components/collection-detail";
import { EmptyState } from "@/components/empty-state";
import { useRole } from "@/components/role-provider";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { VisitorBarChart } from "@/components/visitor-chart";
import {
  buildWeeklyVisitorMetrics,
  countVisitsForLastDays,
  countVisitsForToday,
} from "@/hooks/use-realtime-attendances";
import { cn, formatDate } from "@/lib/utils";
import type { Attendance, Book, Thesis } from "@/lib/types";

export function DashboardOverview({
  attendances,
  attendanceLoading,
  attendanceError,
  books,
  theses,
  collections,
  catalogLoading,
  catalogError,
}: {
  attendances: Attendance[];
  attendanceLoading: boolean;
  attendanceError: string | null;
  books: Book[];
  theses: Thesis[];
  collections: (Book | Thesis)[];
  catalogLoading: boolean;
  catalogError: string | null;
}) {
  const { role, userDisplayName } = useRole();
  const metrics = useMemo(
    () => buildWeeklyVisitorMetrics(attendances),
    [attendances],
  );
  const canEdit = role === "admin" || role === "petugas";
  const canReport = role === "admin" || role === "dosen";
  const firstName = userDisplayName.split(" ")[0] || "Admin";
  return (
    <div className="space-y-6">
      <AdminPageHeading
        title={`Selamat datang, ${firstName}.`}
        description="Ruang untuk mengelola koleksi, membaca aktivitas, dan mendukung perjalanan belajar."
      >
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link href="/katalog" className="admin-hero-button">
            Lihat katalog publik <ArrowUpRight className="size-4" />
          </Link>
          <span className="inline-flex items-center gap-2 text-xs text-rose-100">
            <CalendarDays className="size-3.5" />
            {new Intl.DateTimeFormat("id-ID", {
              timeZone: "Asia/Makassar",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </span>
        </div>
      </AdminPageHeading>
      {(catalogError || attendanceError) && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <p className="font-bold">Sebagian data belum dapat dimuat</p>
          <p className="mt-1">
            {[catalogError, attendanceError].filter(Boolean).join(" · ")}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 font-semibold underline underline-offset-4"
          >
            Coba muat ulang
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          icon={BookOpen}
          label="Total buku"
          value={catalogError ? "—" : catalogLoading ? "..." : books.length}
          trend="Koleksi di katalog"
          tone="emerald"
        />
        <StatCard
          icon={GraduationCap}
          label="Total skripsi"
          value={catalogError ? "—" : catalogLoading ? "..." : theses.length}
          trend="Repositori mahasiswa"
          tone="blue"
        />
        <StatCard
          icon={Users}
          label="Kunjungan hari ini"
          value={
            attendanceError
              ? "—"
              : attendanceLoading
                ? "..."
                : countVisitsForToday(attendances)
          }
          trend="Presensi ruang baca"
          tone="slate"
        />
        <StatCard
          icon={CalendarDays}
          label="Kunjungan 7 hari"
          value={
            attendanceError
              ? "—"
              : attendanceLoading
                ? "..."
                : countVisitsForLastDays(attendances, 7)
          }
          trend="Tujuh hari terakhir"
          tone="amber"
        />
      </div>
      <div className="admin-shortcuts" aria-label="Aksi cepat">
        <span className="text-xs font-bold text-slate-600">Aksi cepat</span>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <>
              <AddBookDialog
                trigger={
                  <button
                    type="button"
                    className="admin-shortcut shortcut-rose"
                  >
                    <Plus />
                    Tambah buku
                  </button>
                }
              />
              <AddThesisDialog
                trigger={
                  <button
                    type="button"
                    className="admin-shortcut shortcut-violet"
                  >
                    <Plus />
                    Tambah skripsi
                  </button>
                }
              />
            </>
          )}
          <Link href="/presensi" className="admin-shortcut shortcut-teal">
            <ScanLine />
            Buka presensi
          </Link>
          {canReport && (
            <Link
              href="/dashboard/laporan"
              className="admin-shortcut shortcut-amber"
            >
              <FileDown />
              Ekspor laporan
            </Link>
          )}
          {!canEdit && (
            <Link
              href="/dashboard/katalog"
              className="admin-shortcut shortcut-violet"
            >
              <BookOpen />
              Jelajahi koleksi
            </Link>
          )}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <SectionCard
          title="Aktivitas kunjungan"
          description="Presensi ruang baca pada pekan berjalan."
          action={
            <span className="admin-period">
              <CalendarDays className="size-3.5" />
              Pekan ini
            </span>
          }
        >
          {attendanceLoading ? (
            <PanelSkeleton />
          ) : attendanceError ? (
            <PanelUnavailable />
          ) : (
            <VisitorBarChart metrics={metrics} />
          )}
          <p className="mt-4 text-[11px] leading-5 text-slate-500">
            {attendances.length >= 500
              ? "Ringkasan dari 500 presensi terbaru."
              : "Berdasarkan presensi yang tercatat."}{" "}
            Kunjungan ruang baca berbeda dari kunjungan website.
          </p>
        </SectionCard>
        <SectionCard
          title="Komposisi koleksi"
          description="Buku dan skripsi dalam katalog."
        >
          {catalogLoading ? (
            <PanelSkeleton />
          ) : catalogError ? (
            <PanelUnavailable />
          ) : (
            <CollectionComposition
              books={books.length}
              theses={theses.length}
            />
          )}
        </SectionCard>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Presensi terbaru"
          description="Kunjungan terakhir yang tercatat."
          action={<MoreLink href="/dashboard/presensi" />}
        >
          {attendanceLoading ? (
            <PanelSkeleton />
          ) : attendanceError ? (
            <PanelUnavailable />
          ) : attendances.length ? (
            <div className="divide-y divide-slate-100">
              {attendances.slice(0, 5).map((item) => (
                <AttendanceItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Belum ada kunjungan"
              description="Presensi akan muncul setelah pengunjung mencatat kehadiran."
            />
          )}
        </SectionCard>
        <SectionCard
          title="Koleksi terbaru"
          description="Tambahan terbaru untuk ruang baca."
          action={<MoreLink href="/dashboard/katalog" />}
        >
          {catalogLoading ? (
            <PanelSkeleton />
          ) : catalogError ? (
            <PanelUnavailable />
          ) : collections.length ? (
            <div className="divide-y divide-slate-100">
              {collections.slice(0, 5).map((item) => (
                <CollectionItem key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Koleksi siap ditambahkan"
              description="Mulai dengan menambahkan buku atau skripsi ke katalog."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function MoreLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-rose-800"
    >
      Lihat semua <ArrowRight className="size-3.5" />
    </Link>
  );
}
function PanelSkeleton() {
  return (
    <div className="space-y-4 py-3" role="status" aria-label="Memuat data">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}
function PanelUnavailable() {
  return (
    <EmptyState
      title="Data belum tersedia"
      description="Muat ulang halaman untuk mencoba mengambil data kembali."
    />
  );
}
function AttendanceItem({ item }: { item: Attendance }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="admin-person-avatar">
        {item.guestName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((s) => s[0])
          .join("")}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">
          {item.guestName}
        </p>
        <p className="mt-1 truncate text-xs text-slate-500">{item.purpose}</p>
      </div>
      <div className="shrink-0 text-right">
        <span className="admin-status">{item.visitorStatus}</span>
        <p className="mt-1.5 text-[10px] text-slate-500">
          {formatDate(item.visitedAt)}
        </p>
      </div>
    </div>
  );
}
function CollectionItem({ item }: { item: Book | Thesis }) {
  const thesis = item.type === "thesis";
  const Icon = thesis ? GraduationCap : BookOpen;
  return (
    <div className="group flex items-center gap-3 py-3.5">
      <span
        className={cn(
          "admin-collection-icon",
          thesis ? "collection-violet" : "collection-rose",
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-bold leading-5 text-slate-800 sm:line-clamp-1">
          {item.title}
        </p>
        <p className="mt-1 truncate text-xs text-slate-500">
          {thesis ? item.studentName : item.author}
        </p>
      </div>
      <span className="hidden text-[10px] font-semibold text-slate-500 sm:inline">
        {thesis ? "Skripsi" : "Buku"}
      </span>
      <CollectionDetail item={item} />
    </div>
  );
}
function CollectionComposition({
  books,
  theses,
}: {
  books: number;
  theses: number;
}) {
  const total = books + theses;
  if (!total)
    return (
      <EmptyState
        title="Belum ada koleksi"
        description="Komposisi akan tampil saat katalog sudah terisi."
      />
    );
  const percent = Math.round((books / total) * 100);
  return (
    <div>
      <div className="admin-donut-wrap">
        <svg
          viewBox="0 0 200 200"
          className="admin-donut"
          role="img"
          aria-label={`${books} buku dan ${theses} skripsi`}
        >
          <circle
            cx="100"
            cy="100"
            r="76"
            fill="none"
            stroke="#eee9f2"
            strokeWidth="21"
          />
          <circle
            cx="100"
            cy="100"
            r="76"
            pathLength="100"
            fill="none"
            stroke="#9254d6"
            strokeWidth="21"
          />
          <circle
            cx="100"
            cy="100"
            r="76"
            pathLength="100"
            fill="none"
            stroke="#e04c70"
            strokeWidth="21"
            strokeDasharray={`${(books / total) * 100} 100`}
            transform="rotate(-90 100 100)"
          />
        </svg>
        <div className="admin-donut-label">
          <strong>{total.toLocaleString("id-ID")}</strong>
          <span>total koleksi</span>
        </div>
      </div>
      <div className="space-y-3">
        <CompositionLegend
          icon={BookOpen}
          label="Buku"
          value={books}
          percent={percent}
          tone="rose"
        />
        <CompositionLegend
          icon={GraduationCap}
          label="Skripsi"
          value={theses}
          percent={100 - percent}
          tone="violet"
        />
      </div>
    </div>
  );
}
function CompositionLegend({
  icon: Icon,
  label,
  value,
  percent,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  percent: number;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-2.5 text-xs">
      <span className={`admin-legend-icon collection-${tone}`}>
        <Icon className="size-3.5" />
      </span>
      <span className="flex-1 font-semibold text-slate-700">{label}</span>
      <span className="font-bold tabular-nums text-slate-900">
        {value.toLocaleString("id-ID")}
      </span>
      <span className="w-10 text-right tabular-nums text-slate-500">
        {percent}%
      </span>
    </div>
  );
}
