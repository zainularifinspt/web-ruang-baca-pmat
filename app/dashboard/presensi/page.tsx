"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Clock3,
  Filter,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ExportButton } from "@/components/export-button";
import { InitialAvatar } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { visitPurposes, visitorStatuses } from "@/lib/mock-data";
import {
  countVisitsForCurrentMonth,
  countVisitsForLastDays,
  countVisitsForToday,
  useRealtimeAttendances,
} from "@/hooks/use-realtime-attendances";
import type { Attendance, VisitPurpose, VisitorStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const statusTone: Record<VisitorStatus, string> = {
  Mahasiswa: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Dosen: "bg-slate-100 text-slate-700 border-slate-200",
  Umum: "bg-amber-50 text-amber-700 border-amber-100",
};

export default function AttendanceReportPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<VisitorStatus | "semua">("semua");
  const [purposeFilter, setPurposeFilter] = useState<VisitPurpose | "semua">("semua");
  const { attendances, isLoading, error } = useRealtimeAttendances(500);

  const filteredAttendances = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return attendances.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.guestName.toLowerCase().includes(normalizedQuery) ||
        item.guestNim.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "semua" || item.visitorStatus === statusFilter;
      const matchesPurpose =
        purposeFilter === "semua" || item.purpose === purposeFilter;

      return matchesQuery && matchesStatus && matchesPurpose;
    });
  }, [attendances, purposeFilter, query, statusFilter]);

  const todayVisits = useMemo(() => countVisitsForToday(attendances), [attendances]);
  const weekVisits = useMemo(() => countVisitsForLastDays(attendances, 7), [attendances]);
  const monthVisits = useMemo(() => countVisitsForCurrentMonth(attendances), [attendances]);
  const topPurpose = useMemo(() => getTopPurpose(attendances), [attendances]);

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-emerald-800 via-teal-700 to-cyan-800 p-5 text-white shadow-xl shadow-emerald-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-cyan-300 opacity-25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-violet-300 opacity-20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
        <div className="relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-emerald-50 shadow-sm ring-1 ring-white/25 backdrop-blur">
              <Sparkles className="size-3.5" />
              Internal / Presensi
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Data Kunjungan
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-emerald-50">
              Pantau aktivitas pengunjung, saring data operasional, dan siapkan laporan presensi ruang baca.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button asChild size="sm" className="h-10 rounded-xl bg-emerald-700 px-4 text-sm font-semibold shadow-sm hover:bg-emerald-800">
          <Link href="/presensi">
            <CalendarCheck className="size-4" />
            Buka Mode Presensi QR
          </Link>
        </Button>
        <ExportButton
          type="attendance"
          label="Ekspor presensi"
          className="h-10 rounded-xl px-4 text-sm"
        />
      </div>

      <div className="grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AttendanceStatCard
          icon={CalendarCheck}
          label="Pengunjung hari ini"
          value={isLoading ? "..." : todayVisits}
          trend="Realtime dari presensi"
        />
        <AttendanceStatCard
          icon={Users}
          label="Pengunjung minggu ini"
          value={isLoading ? "..." : weekVisits}
          trend="7 hari terakhir"
          tone="blue"
        />
        <AttendanceStatCard
          icon={Clock3}
          label="Pengunjung bulan ini"
          value={isLoading ? "..." : monthVisits}
          trend="Bulan berjalan"
          tone="amber"
        />
        <AttendanceStatCard
          icon={Target}
          label="Keperluan terbanyak"
          value={isLoading ? "..." : topPurpose.shortLabel}
          trend={topPurpose.fullLabel}
          tone="slate"
        />
      </div>

      <div className="min-w-0">
        <section className="min-w-0 rounded-[1.25rem] border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-950">Daftar Presensi</h2>
                <Badge variant="secondary" className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {filteredAttendances.length} data
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Pencarian dan filter aktif untuk kunjungan ruang baca.
              </p>
            </div>
          </div>

          <div className="border-b border-slate-100 bg-slate-50/55 px-4 py-3 sm:px-5">
            <div className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_170px_210px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-9 rounded-lg border-slate-200/80 bg-white pl-8 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-emerald-200"
                  placeholder="Cari nama atau NIM/NIP"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as VisitorStatus | "semua")}
              >
                <SelectTrigger className="h-9 rounded-lg border-slate-200/80 bg-white text-sm shadow-none">
                  <Filter className="size-3.5 text-slate-400" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua status</SelectItem>
                  {visitorStatuses.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={purposeFilter}
                onValueChange={(value) => setPurposeFilter(value as VisitPurpose | "semua")}
              >
                <SelectTrigger className="h-9 rounded-lg border-slate-200/80 bg-white text-sm shadow-none">
                  <SelectValue placeholder="Keperluan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua keperluan</SelectItem>
                  {visitPurposes.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {isLoading ? (
              <AttendanceListSkeleton />
            ) : error ? (
              <EmptyState
                title="Gagal memuat presensi"
                description={error}
              />
            ) : filteredAttendances.length ? (
              <>
                <div className="hidden overflow-x-auto rounded-xl border border-slate-200/70 md:block">
                  <Table className="min-w-[760px]">
                    <TableHeader className="sticky top-0 z-10 bg-slate-50/95">
                      <TableRow>
                        <TableHead className="h-9 min-w-56 px-3 text-xs font-semibold">Pengunjung</TableHead>
                        <TableHead className="h-9 w-28 px-3 text-xs font-semibold">NIM/NIP</TableHead>
                        <TableHead className="h-9 w-24 px-3 text-xs font-semibold">Status</TableHead>
                        <TableHead className="h-9 px-3 text-xs font-semibold">Keperluan</TableHead>
                        <TableHead className="h-9 w-40 px-3 text-xs font-semibold">Waktu</TableHead>
                        <TableHead className="h-9 w-24 px-3 text-xs font-semibold">Presensi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAttendances.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className={cn(
                            "border-slate-100 hover:bg-emerald-50/35",
                            index % 2 === 1 && "bg-slate-50/35",
                          )}
                        >
                          <TableCell className="px-3 py-2.5">
                            <div className="flex items-center gap-3">
                              <InitialAvatar name={item.guestName} className="size-8 bg-emerald-100 text-[11px] text-emerald-800" />
                              <div>
                                <p className="text-sm font-semibold leading-5 text-slate-950">
                                  {item.guestName}
                                </p>
                                <p className="text-xs leading-4 text-slate-500">
                                  {item.studyProgram}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-xs font-medium text-slate-600">
                            {item.guestNim}
                          </TableCell>
                          <TableCell className="px-3 py-2.5">
                            <StatusPill status={item.visitorStatus} />
                          </TableCell>
                          <TableCell className="px-3 py-2.5">
                            <Badge variant="secondary" className="max-w-52 truncate rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                              {item.purpose}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-xs text-slate-500">
                            {formatDate(item.visitedAt)}
                          </TableCell>
                          <TableCell className="px-3 py-2.5">
                            <Badge className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 shadow-none">
                              {item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="grid gap-2 md:hidden">
                  {filteredAttendances.map((item) => (
                    <MobileAttendanceCard key={item.id} item={item} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                title="Data presensi tidak ditemukan"
                description="Coba ubah kata kunci pencarian atau longgarkan filter yang aktif."
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function AttendanceStatCard({
  icon: Icon,
  label,
  value,
  trend,
  tone = "emerald",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trend: string;
  tone?: "emerald" | "blue" | "amber" | "slate";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: "bg-sky-50 text-sky-700 ring-sky-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return (
    <div className="flex h-full min-h-28 items-center justify-between gap-3 rounded-[1.15rem] border border-slate-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1.5 truncate text-3xl font-semibold tracking-tight text-slate-950">
          {value}
        </p>
        <p className="mt-2 inline-flex max-w-full items-center gap-1 text-xs font-medium text-emerald-700">
          <TrendingUp className="size-3" />
          <span className="truncate">{trend}</span>
        </p>
      </div>
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl ring-1", tones[tone])}>
        <Icon className="size-4" />
      </div>
    </div>
  );
}

function MobileAttendanceCard({ item }: { item: Attendance }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start gap-3">
        <InitialAvatar name={item.guestName} className="size-9 bg-emerald-100 text-xs text-emerald-800" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{item.guestName}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.guestNim}</p>
            </div>
            <StatusPill status={item.visitorStatus} />
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{item.purpose}</p>
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>{item.studyProgram}</span>
            <span>{formatTime(item.visitedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendanceListSkeleton() {
  return (
    <div className="grid gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3">
          <div className="size-9 rounded-xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-44 rounded bg-slate-200" />
            <div className="h-3 w-32 rounded bg-slate-200" />
          </div>
          <div className="hidden h-6 w-24 rounded-md bg-slate-200 sm:block" />
        </div>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: VisitorStatus }) {
  return (
    <Badge
      className={cn(
        "rounded-md border px-2 py-0.5 text-[11px] font-medium shadow-none",
        statusTone[status],
      )}
    >
      {status}
    </Badge>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getTopPurpose(attendances: Attendance[]) {
  const grouped = attendances.reduce<Record<string, number>>((acc, item) => {
    acc[item.purpose] = (acc[item.purpose] ?? 0) + 1;
    return acc;
  }, {});
  const [fullLabel = "Belum ada"] = Object.entries(grouped).sort((a, b) => b[1] - a[1])[0] ?? [];

  return {
    fullLabel,
    shortLabel: fullLabel.length > 14 ? `${fullLabel.slice(0, 14)}...` : fullLabel,
  };
}
