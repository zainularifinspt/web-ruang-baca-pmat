"use client";

import { ExportButton } from "@/components/export-button";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { VisitorBarChart, VisitorLineChart } from "@/components/visitor-chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  buildWeeklyVisitorMetrics,
  useRealtimeAttendances,
} from "@/hooks/use-realtime-attendances";

export default function ReportsPage() {
  const { attendances } = useRealtimeAttendances();
  const visitorMetrics = buildWeeklyVisitorMetrics(attendances);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Laporan"
        title="Analitik Pengunjung"
        description="Ringkasan visual untuk membaca tren kunjungan dan kebutuhan koleksi ruang baca."
        action={<ExportButton type="visitor" label="Ekspor laporan pengunjung" />}
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Kunjungan Harian" description="Jumlah kunjungan per hari.">
          <VisitorBarChart metrics={visitorMetrics} />
        </SectionCard>
        <SectionCard title="Minat Koleksi" description="Perbandingan pencarian buku dan skripsi.">
          <VisitorLineChart metrics={visitorMetrics} />
        </SectionCard>
      </div>
      <SectionCard title="Ringkasan Data" description="Data tabel untuk kebutuhan presentasi dan laporan.">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Hari</TableHead>
              <TableHead>Kunjungan</TableHead>
              <TableHead>Cari buku</TableHead>
              <TableHead>Cari skripsi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visitorMetrics.map((item) => (
              <TableRow key={item.label}>
                <TableCell className="font-medium">{item.label}</TableCell>
                <TableCell>{item.visits}</TableCell>
                <TableCell>{item.books}</TableCell>
                <TableCell>{item.theses}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
