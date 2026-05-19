"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CalendarCheck,
  CheckCheck,
  ClipboardCheck,
  Download,
  GraduationCap,
  LibraryBig,
  MessageCircle,
  Plus,
  QrCode,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { CollectionDetail } from "@/components/collection-detail";
import { EmptyState } from "@/components/empty-state";
import { ExportButton } from "@/components/export-button";
import { QuickActionCard } from "@/components/quick-action-card";
import { useRole } from "@/components/role-provider";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  allCollections,
  attendances,
  books,
  theses,
  visitorMetrics,
  whatsappSubmissions,
} from "@/lib/mock-data";
import type { Attendance, Book, Thesis } from "@/lib/types";
import { cn, formatDate, formatShortDate } from "@/lib/utils";

type CollectionItem = Book | Thesis;

const previewDate = "2026-05-18";
const VisitorBarChart = dynamic(
  () => import("@/components/visitor-chart").then((mod) => mod.VisitorBarChart),
  { loading: () => <ChartPlaceholder /> },
);
const VisitorLineChart = dynamic(
  () => import("@/components/visitor-chart").then((mod) => mod.VisitorLineChart),
  { loading: () => <ChartPlaceholder /> },
);

function ChartPlaceholder() {
  return (
    <div className="h-80 rounded-2xl border border-slate-200 bg-slate-50/70" />
  );
}

export default function DashboardPage() {
  const { role, roleLabel } = useRole();
  const collections = allCollections();
  const verificationQueue = collections.filter(
    (item) => item.verificationStatus !== "Disetujui",
  );
  const todayVisits = attendances.filter((item) =>
    item.visitedAt.includes(previewDate),
  ).length;
  const weeklyVisits = visitorMetrics.reduce((sum, item) => sum + item.visits, 0);
  const newBooks = books.filter((item) => item.createdAt >= "2026-05-01").length;
  const newTheses = theses.filter((item) => item.createdAt >= "2026-05-01").length;

  if (role === "dosen") {
    return (
      <DosenDashboard
        roleLabel={roleLabel}
        weeklyVisits={weeklyVisits}
        verificationQueue={verificationQueue}
      />
    );
  }

  if (role === "petugas") {
    return (
      <PetugasDashboard
        roleLabel={roleLabel}
        todayVisits={todayVisits}
        newBooks={newBooks}
        newTheses={newTheses}
        verificationQueue={verificationQueue}
      />
    );
  }

  return (
    <AdminDashboard
      roleLabel={roleLabel}
      todayVisits={todayVisits}
      weeklyVisits={weeklyVisits}
      verificationQueue={verificationQueue}
    />
  );
}

function AdminDashboard({
  roleLabel,
  todayVisits,
  weeklyVisits,
  verificationQueue,
}: {
  roleLabel: string;
  todayVisits: number;
  weeklyVisits: number;
  verificationQueue: CollectionItem[];
}) {
  return (
    <DashboardFrame
      eyebrow={roleLabel}
      title="Ringkasan Ruang Baca PMat"
      description="Pantau koleksi, kunjungan, presensi, dan antrean verifikasi dalam satu layar yang rapi."
      actions={
        <>
          <Button asChild className="rounded-xl">
            <Link href="/dashboard/katalog">
              <Plus />
              Tambah Buku
            </Link>
          </Button>
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href="/presensi">
              <QrCode />
              Buka Presensi QR
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={BookOpen} label="Total buku" value={books.length} trend="Katalog siap ditelusuri" tone="emerald" />
        <StatCard icon={GraduationCap} label="Total skripsi" value={theses.length} trend="Repositori aktif" tone="blue" />
        <StatCard icon={CalendarCheck} label="Pengunjung hari ini" value={todayVisits} trend="+12% dari kemarin" tone="emerald" />
        <StatCard icon={Users} label="Kunjungan minggu ini" value={weeklyVisits} trend="Aktivitas meningkat" tone="amber" />
        <StatCard icon={CheckCheck} label="Antrean verifikasi" value={verificationQueue.length} trend="Perlu ditinjau" tone="slate" />
      </div>

      <QuickActions
        items={[
          { href: "/dashboard/katalog", icon: BookOpen, title: "Tambah Buku", description: "Siapkan data buku baru untuk katalog internal." },
          { href: "/dashboard/katalog", icon: GraduationCap, title: "Tambah Skripsi", description: "Masukkan skripsi baru ke antrean verifikasi.", tone: "blue" },
          { href: "/presensi", icon: QrCode, title: "Buka Presensi QR", description: "Bantu pengunjung mencatat kehadiran dengan cepat.", tone: "amber" },
          { href: "/dashboard/laporan", icon: Download, title: "Ekspor Laporan", description: "Buka laporan pengunjung dan kebutuhan koleksi." },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Tren Kunjungan" description="Kunjungan ruang baca selama pekan berjalan.">
          <VisitorBarChart />
        </SectionCard>
        <SectionCard title="Minat Koleksi" description="Perbandingan kebutuhan buku dan skripsi.">
          <VisitorLineChart />
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <AttendancePanel />
        <VerificationQueuePanel queue={verificationQueue} />
      </div>
    </DashboardFrame>
  );
}

function DosenDashboard({
  roleLabel,
  weeklyVisits,
  verificationQueue,
}: {
  roleLabel: string;
  weeklyVisits: number;
  verificationQueue: CollectionItem[];
}) {
  return (
    <DashboardFrame
      eyebrow={roleLabel}
      title="Monitoring Skripsi dan Aktivitas Katalog"
      description="Fokus pada perkembangan repositori skripsi, topik penelitian, dan pola kunjungan mahasiswa."
      actions={
        <Button asChild className="rounded-xl">
          <Link href="/dashboard/katalog">
            <GraduationCap />
            Tambah Skripsi
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={GraduationCap} label="Total skripsi" value={theses.length} trend="Topik makin beragam" tone="blue" />
        <StatCard icon={Users} label="Statistik kunjungan" value={weeklyVisits} trend="Pekan berjalan" tone="emerald" />
        <StatCard icon={CheckCheck} label="Data perlu ditinjau" value={verificationQueue.filter((item) => item.type === "thesis").length} trend="Prioritas skripsi" tone="slate" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <SectionCard title="Skripsi Berdasarkan Topik" description="Tema penelitian yang muncul dari data contoh.">
          <TopicInterest />
        </SectionCard>
        <SectionCard title="Minat Koleksi" description="Perbandingan kunjungan untuk buku dan skripsi.">
          <VisitorLineChart />
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <LatestThesesPanel />
        <SectionCard title="Statistik Kunjungan" description="Jumlah kunjungan mahasiswa selama pekan berjalan.">
          <VisitorBarChart />
        </SectionCard>
      </div>

      <QuickActions
        items={[
          { href: "/dashboard/katalog", icon: GraduationCap, title: "Tambah Skripsi", description: "Lengkapi data skripsi untuk repositori prodi.", tone: "blue" },
          { href: "/katalog?tab=theses", icon: LibraryBig, title: "Lihat Katalog", description: "Buka tampilan publik untuk meninjau hasil katalog." },
          { href: "/dashboard/laporan", icon: TrendingUp, title: "Lihat Statistik", description: "Pantau grafik kunjungan dan minat koleksi.", tone: "amber" },
        ]}
      />
    </DashboardFrame>
  );
}

function PetugasDashboard({
  roleLabel,
  todayVisits,
  newBooks,
  newTheses,
  verificationQueue,
}: {
  roleLabel: string;
  todayVisits: number;
  newBooks: number;
  newTheses: number;
  verificationQueue: CollectionItem[];
}) {
  return (
    <DashboardFrame
      eyebrow={roleLabel}
      title="Operasional Harian Ruang Baca"
      description="Pantau presensi terbaru, koleksi yang baru ditambahkan, dan input yang menunggu pengecekan."
      actions={
        <Button asChild className="rounded-xl">
          <Link href="/dashboard/whatsapp">
            <MessageCircle />
            Pratinjau Input WhatsApp
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={CalendarCheck} label="Pengunjung hari ini" value={todayVisits} trend="Siap dilayani" tone="emerald" />
        <StatCard icon={ClipboardCheck} label="Presensi terbaru" value={attendances.length} trend="Catatan aktif" tone="blue" />
        <StatCard icon={BookOpen} label="Buku baru ditambahkan" value={newBooks} trend="Bulan ini" tone="amber" />
        <StatCard icon={GraduationCap} label="Skripsi baru ditambahkan" value={newTheses} trend="Bulan ini" tone="blue" />
        <StatCard icon={CheckCheck} label="Input menunggu verifikasi" value={verificationQueue.length} trend="Perlu dicek" tone="slate" />
      </div>

      <QuickActions
        items={[
          { href: "/dashboard/katalog", icon: BookOpen, title: "Input Buku", description: "Tambahkan buku baru dari meja layanan." },
          { href: "/dashboard/katalog", icon: GraduationCap, title: "Input Skripsi", description: "Catat skripsi baru untuk dicek admin.", tone: "blue" },
          { href: "/presensi", icon: QrCode, title: "Bantu Presensi", description: "Buka presensi ketika pengunjung datang.", tone: "amber" },
          { href: "/dashboard/whatsapp", icon: MessageCircle, title: "Pratinjau Input WhatsApp", description: "Uji format pesan koleksi sebelum ditinjau." },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[0.98fr_1.02fr]">
        <AttendancePanel showExport={false} />
        <VerificationQueuePanel queue={verificationQueue} title="Antrean Input Menunggu Verifikasi" />
      </div>

      <SectionCard title="Riwayat Input WhatsApp" description="Pesan contoh yang masuk ke alur pratinjau.">
        <div className="grid gap-3 md:grid-cols-2">
          {whatsappSubmissions.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-emerald-200 hover:bg-white hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{item.sender}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(item.receivedAt)}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{item.response}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardFrame>
  );
}

function DashboardFrame({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-emerald-800 p-5 text-white shadow-md sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-sm font-semibold text-emerald-50 ring-1 ring-white/20">
              <Sparkles className="size-3.5" />
              {eyebrow}
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-emerald-50">
              {description}
            </p>
            <p className="mt-5 w-fit rounded-full bg-white/12 px-3 py-1.5 text-xs font-medium text-emerald-50 ring-1 ring-white/20">
              Mode pratinjau: data masih contoh untuk validasi alur.
            </p>
          </div>
          {actions ? (
            <div className="flex w-full flex-wrap gap-2 sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
              {actions}
            </div>
          ) : null}
        </div>
      </section>
      {children}
    </div>
  );
}

function QuickActions({
  items,
}: {
  items: Array<{
    href: string;
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
    tone?: "emerald" | "blue" | "amber";
  }>;
}) {
  return (
    <div className={cn("grid gap-4", items.length === 3 ? "md:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-4")}>
      {items.map((item) => (
        <QuickActionCard key={item.title} {...item} />
      ))}
    </div>
  );
}

function AttendancePanel({ showExport = true }: { showExport?: boolean }) {
  return (
    <SectionCard
      title="Presensi Terbaru"
      description="Aktivitas kunjungan terakhir yang tercatat."
      action={showExport ? <ExportButton type="attendance" label="Ekspor" /> : undefined}
    >
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Tujuan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Waktu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendances.map((item) => (
              <AttendanceRow key={item.id} item={item} />
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="grid gap-3 md:hidden">
        {attendances.map((item) => (
          <AttendanceCard key={item.id} item={item} />
        ))}
      </div>
    </SectionCard>
  );
}

function AttendanceRow({ item }: { item: Attendance }) {
  return (
    <TableRow className="hover:bg-emerald-50/40">
      <TableCell>
        <div className="flex items-center gap-3">
          <InitialsAvatar name={item.guestName} />
          <div>
            <p className="font-semibold text-slate-950">{item.guestName}</p>
            <p className="text-xs text-slate-500">{item.guestNim}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="max-w-[180px] text-slate-600">{item.purpose}</TableCell>
      <TableCell>
        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
          {item.visitorStatus}
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap text-slate-600">{formatDate(item.visitedAt)}</TableCell>
    </TableRow>
  );
}

function AttendanceCard({ item }: { item: Attendance }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start gap-3">
        <InitialsAvatar name={item.guestName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-slate-950">{item.guestName}</p>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              {item.visitorStatus}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{item.purpose}</p>
          <p className="mt-2 text-xs text-slate-500">{formatDate(item.visitedAt)}</p>
        </div>
      </div>
    </div>
  );
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-sm font-bold text-white shadow-sm shadow-emerald-900/10">
      {initials}
    </span>
  );
}

function VerificationQueuePanel({
  queue,
  title = "Antrean Verifikasi Terbaru",
}: {
  queue: CollectionItem[];
  title?: string;
}) {
  return (
    <SectionCard title={title} description="Koleksi yang membutuhkan tindak lanjut.">
      {queue.length ? (
        <div className="grid gap-3">
          {queue.slice(0, 5).map((item) => (
            <VerificationItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Tidak ada antrean"
          description="Semua input contoh sudah tertata rapi."
          className="bg-slate-50/70"
        />
      )}
    </SectionCard>
  );
}

function VerificationItem({ item }: { item: CollectionItem }) {
  const Icon = item.type === "book" ? BookOpen : GraduationCap;
  const author = item.type === "book" ? item.author : item.authorName;

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="rounded-2xl bg-white p-2.5 text-emerald-700 ring-1 ring-emerald-100 transition group-hover:bg-emerald-50">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="line-clamp-1 font-semibold text-slate-950">{item.title}</p>
          <p className="mt-1 text-sm text-slate-500">{author} · {formatShortDate(item.createdAt)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={item.verificationStatus} />
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
              {item.inputSource}
            </span>
          </div>
        </div>
      </div>
      <CollectionDetail item={item} />
    </div>
  );
}

function TopicInterest() {
  const topics = theses
    .flatMap((item) => item.keywords.slice(0, 2))
    .reduce<Record<string, number>>((acc, keyword) => {
      acc[keyword] = (acc[keyword] ?? 0) + 1;
      return acc;
    }, {});
  const entries = Object.entries(topics).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(...entries.map(([, value]) => value));

  return (
    <div className="space-y-3">
      {entries.map(([topic, value], index) => (
        <div key={topic} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-xl bg-white text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                {index + 1}
              </span>
              <p className="font-medium capitalize text-slate-800">{topic}</p>
            </div>
            <span className="text-sm font-semibold text-slate-500">{value}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-emerald-600"
              style={{ width: `${Math.max(34, (value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function LatestThesesPanel() {
  return (
    <SectionCard title="Data Skripsi Terbaru" description="Repositori skripsi yang baru masuk ke katalog.">
      <div className="grid gap-3">
        {theses.map((item) => (
          <Link
            key={item.id}
            href={`/katalog/skripsi/${item.id}`}
            className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="line-clamp-2 font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.authorName} · {item.graduationYear}</p>
              </div>
              <ArrowUpRight className="size-4 shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-700" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.keywords.slice(0, 3).map((keyword) => (
                <span key={keyword} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                  {keyword}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
