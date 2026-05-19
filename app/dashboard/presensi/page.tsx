"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarCheck,
  Clock3,
  Filter,
  Search,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ExportButton } from "@/components/export-button";
import { InitialAvatar } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
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
import { attendances, visitPurposes, visitorStatuses } from "@/lib/mock-data";
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
  }, [purposeFilter, query, statusFilter]);

  const todayVisits = attendances.filter((item) =>
    item.visitedAt.includes("2026-05-18"),
  ).length;
  const monthVisits = attendances.filter((item) =>
    item.visitedAt.startsWith("2026-05"),
  ).length;
  const topPurpose = getTopPurpose();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Internal / Presensi"
        title="Data Kunjungan"
        description="Pantau aktivitas pengunjung, saring data operasional, dan siapkan laporan presensi ruang baca."
        className="rounded-[1.25rem] border-slate-200/70 bg-white/95 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] [&_h1]:text-2xl [&_h1]:font-semibold [&_p]:text-sm sm:p-5 sm:[&_h1]:text-2xl"
        action={
          <>
            <Button asChild size="sm" className="h-9 rounded-lg bg-emerald-700 px-3 text-xs hover:bg-emerald-800">
              <Link href="/presensi">
                <CalendarCheck className="size-3.5" />
                Buka Mode Presensi QR
              </Link>
            </Button>
            <ExportButton
              type="attendance"
              label="Ekspor presensi"
              className="h-9 rounded-lg px-3 text-xs"
            />
          </>
        }
      />

      <div className="grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AttendanceStatCard
          icon={CalendarCheck}
          label="Pengunjung hari ini"
          value={todayVisits}
          trend="Mode pratinjau"
        />
        <AttendanceStatCard
          icon={Users}
          label="Pengunjung minggu ini"
          value={attendances.length}
          trend="+18% dari pekan lalu"
          tone="blue"
        />
        <AttendanceStatCard
          icon={Clock3}
          label="Pengunjung bulan ini"
          value={monthVisits}
          trend="Mei 2026"
          tone="amber"
        />
        <AttendanceStatCard
          icon={Target}
          label="Keperluan terbanyak"
          value={topPurpose.shortLabel}
          trend={topPurpose.fullLabel}
          tone="slate"
        />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
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
            {filteredAttendances.length ? (
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

        <aside className="min-w-0 rounded-[1.25rem] border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-100 px-4 py-4">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Presensi Terbaru</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">Cuplikan aktivitas operasional.</p>
              </div>
              <Badge variant="secondary" className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                Live
              </Badge>
            </div>
          </div>
          <div className="max-h-[430px] divide-y divide-slate-100 overflow-y-auto px-2 py-2">
            {attendances.map((item) => (
              <RecentAttendanceItem key={item.id} item={item} />
            ))}
          </div>
        </aside>
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

function RecentAttendanceItem({ item }: { item: Attendance }) {
  return (
    <div className="group rounded-xl px-2 py-3 transition hover:bg-slate-50">
      <div className="flex items-start gap-3">
        <InitialAvatar
          name={item.guestName}
          className="size-9 bg-slate-100 text-xs text-slate-700 ring-1 ring-slate-200"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-5 text-slate-950">
                {item.guestName}
              </p>
              <p className="truncate text-xs leading-5 text-slate-500">{item.purpose}</p>
            </div>
            <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-slate-300 transition group-hover:text-emerald-600" />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <StatusPill status={item.visitorStatus} />
            <span className="text-[11px] font-medium text-slate-400">
              {formatTime(item.visitedAt)}
            </span>
          </div>
        </div>
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

function getTopPurpose() {
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
