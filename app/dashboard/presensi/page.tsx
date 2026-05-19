"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Clock3,
  Filter,
  Search,
  Target,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ExportButton } from "@/components/export-button";
import { InitialAvatar } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
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
import type { VisitPurpose, VisitorStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Presensi"
        title="Data Kunjungan"
        description="Pantau aktivitas pengunjung ruang baca, saring berdasarkan identitas, status, dan keperluan kunjungan."
        action={
          <>
            <Button asChild className="rounded-xl bg-emerald-700 hover:bg-emerald-800">
              <Link href="/presensi">
                <CalendarCheck className="size-4" />
                Buka Mode Presensi QR
              </Link>
            </Button>
            <ExportButton type="attendance" label="Ekspor presensi" />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarCheck}
          label="Pengunjung hari ini"
          value={todayVisits}
          trend="Tercatat pada mode pratinjau"
        />
        <StatCard
          icon={Users}
          label="Pengunjung minggu ini"
          value={attendances.length}
          trend="+18% dari pekan lalu"
          tone="blue"
        />
        <StatCard
          icon={Clock3}
          label="Pengunjung bulan ini"
          value={monthVisits}
          trend="Periode Mei 2026"
          tone="amber"
        />
        <StatCard
          icon={Target}
          label="Keperluan terbanyak"
          value={topPurpose.shortLabel}
          trend={topPurpose.fullLabel}
          tone="slate"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <SectionCard
          title="Daftar Presensi"
          description="Gunakan pencarian dan filter untuk menemukan kunjungan tertentu."
          action={
            <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-600">
              {filteredAttendances.length} data tampil
            </Badge>
          }
        >
          <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px_260px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-9 shadow-none"
                placeholder="Cari nama atau NIM/NIP"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as VisitorStatus | "semua")}
            >
              <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50">
                <Filter className="size-4 text-slate-400" />
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
              <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50">
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

          {filteredAttendances.length ? (
            <div className="overflow-x-auto rounded-3xl border border-slate-100">
              <Table className="min-w-[860px]">
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="min-w-64">Pengunjung</TableHead>
                    <TableHead>NIM/NIP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Keperluan</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Presensi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendances.map((item) => (
                    <TableRow key={item.id} className="hover:bg-emerald-50/40">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <InitialAvatar name={item.guestName} />
                          <div>
                            <p className="font-semibold text-slate-950">
                              {item.guestName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {item.studyProgram}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        {item.guestNim}
                      </TableCell>
                      <TableCell>
                        <Badge className={`rounded-full border ${statusTone[item.visitorStatus]}`}>
                          {item.visitorStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-full bg-white text-slate-700 ring-1 ring-slate-200">
                          {item.purpose}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {formatDate(item.visitedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-emerald-100 text-emerald-700">
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              title="Data presensi tidak ditemukan"
              description="Coba ubah kata kunci pencarian atau longgarkan filter yang aktif."
            />
          )}
        </SectionCard>

        <SectionCard title="Presensi Terbaru" description="Cuplikan aktivitas operasional.">
          <div className="space-y-3">
            {attendances.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                <div className="flex items-start gap-3">
                  <InitialAvatar name={item.guestName} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-950">
                      {item.guestName}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {item.purpose}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Badge className={`rounded-full border ${statusTone[item.visitorStatus]}`}>
                        {item.visitorStatus}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {new Intl.DateTimeFormat("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(item.visitedAt))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
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
