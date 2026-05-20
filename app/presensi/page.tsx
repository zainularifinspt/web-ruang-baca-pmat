"use client";

import { type ComponentType, type FormEvent, type ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clipboard,
  GraduationCap,
  IdCard,
  LibraryBig,
  QrCode,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { PublicNav } from "@/components/public-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { findUserByNimNip, getVisitorStatusFromRole, visitPurposes, visitorStatuses } from "@/lib/mock-data";
import type { VisitPurpose, VisitorStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

type SubmittedAttendance = {
  identifier: string;
  name: string;
  visitorStatus: VisitorStatus;
  studyProgram: string;
  purpose: VisitPurpose;
  visitedAt: string;
};

export default function AttendancePage() {
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [visitorStatus, setVisitorStatus] = useState<VisitorStatus>("Mahasiswa");
  const [studyProgram, setStudyProgram] = useState("Pendidikan Matematika");
  const [purpose, setPurpose] = useState<VisitPurpose | "">("");
  const [submitted, setSubmitted] = useState<SubmittedAttendance | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const matchedUser = useMemo(
    () => findUserByNimNip(identifier.trim()),
    [identifier],
  );

  const isUnknownIdentifier = identifier.trim().length >= 5 && !matchedUser;
  const canSubmit =
    identifier.trim().length >= 4 &&
    name.trim().length >= 3 &&
    studyProgram.trim().length >= 3 &&
    Boolean(purpose);

  function handleIdentifierChange(value: string) {
    setIdentifier(value);

    const user = findUserByNimNip(value.trim());
    if (!user) {
      return;
    }

    setName(user.name);
    setVisitorStatus(getVisitorStatusFromRole(user.role));
    setStudyProgram(user.studyProgram ?? "Pendidikan Matematika");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || !purpose) {
      return;
    }

    // submit to API
    setIsSubmitting(true);
    void fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_name: name,
        nim_nip: identifier,
        visitor_status: visitorStatus,
        study_program: studyProgram,
        purpose,
      }),
    })
      .then(async (res) => {
        setIsSubmitting(false);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Gagal menyimpan presensi');
        }

        const body = await res.json();
        const row = body.row;
        setSubmitted({
          identifier,
          name: row.visitor_name,
          visitorStatus: row.visitor_status as VisitorStatus,
          studyProgram: row.study_program,
          purpose: row.purpose as VisitPurpose,
          visitedAt: row.visited_at,
        });
        toast.success('Presensi berhasil disimpan');
      })
      .catch((err) => {
        setIsSubmitting(false);
        toast.error(err?.message || 'Gagal menyimpan presensi');
      });
  }

  function resetForm() {
    setIdentifier("");
    setName("");
    setVisitorStatus("Mahasiswa");
    setStudyProgram("Pendidikan Matematika");
    setPurpose("");
    setSubmitted(null);
  }

  function copyAttendanceLink() {
    if (typeof window !== "undefined") {
      void navigator.clipboard?.writeText(window.location.href);
    }

    toast.success("Tautan presensi siap dibagikan", {
      description: "Tautan presensi telah disalin.",
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <PublicNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl space-y-3">
            <Badge className="rounded-full border-emerald-200 bg-white px-3 py-1 text-emerald-700 shadow-sm">
              <QrCode className="mr-1.5 size-3.5" />
              Presensi QR Ruang Baca
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Presensi Kunjungan Ruang Baca
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Isi NIM atau identitas singkat untuk mencatat kunjungan.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="rounded-full bg-white">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Beranda
            </Link>
          </Button>
        </div>

        {submitted ? (
          <SuccessState record={submitted} onReset={resetForm} />
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="overflow-hidden rounded-[2rem] border-emerald-100 bg-white shadow-md shadow-slate-900/5">
              <CardContent className="p-0">
                <div className="border-b border-emerald-100 bg-emerald-50/60 px-5 py-5 sm:px-7">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
                        <QrCode className="size-7" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-700">
                          Form presensi cepat
                        </p>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                          Catat kunjungan dalam satu menit
                        </h2>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-800" htmlFor="identifier">
                      NIM/NIP
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="identifier"
                        value={identifier}
                        onChange={(event) => handleIdentifierChange(event.target.value)}
                        placeholder="Contoh: 2311040007"
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 text-base shadow-none focus-visible:ring-emerald-200"
                      />
                    </div>
                    {matchedUser ? (
                      <div className="flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                        <CheckCircle2 className="size-3.5" />
                        Data ditemukan
                      </div>
                    ) : isUnknownIdentifier ? (
                      <p className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-100">
                        Data belum ditemukan, silakan lengkapi manual.
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nama" icon={UserRound}>
                      <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Nama pengunjung"
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50 shadow-none focus-visible:ring-emerald-200"
                      />
                    </Field>

                    <Field label="Status pengunjung" icon={IdCard}>
                      <Select
                        value={visitorStatus}
                        onValueChange={(value) => setVisitorStatus(value as VisitorStatus)}
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {visitorStatuses.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Field label="Program Studi" icon={GraduationCap}>
                    <Input
                      value={studyProgram}
                      onChange={(event) => setStudyProgram(event.target.value)}
                      placeholder="Contoh: Pendidikan Matematika"
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50 shadow-none focus-visible:ring-emerald-200"
                    />
                  </Field>

                  <Field label="Keperluan kunjungan" icon={LibraryBig}>
                    <Select value={purpose} onValueChange={(value) => setPurpose(value as VisitPurpose)}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
                        <SelectValue placeholder="Pilih keperluan kunjungan" />
                      </SelectTrigger>
                      <SelectContent>
                        {visitPurposes.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Button
                    className="h-12 w-full rounded-2xl bg-emerald-700 text-base shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800"
                    disabled={!canSubmit || isSubmitting}
                    type="submit"
                  >
                    <CalendarCheck className="size-4" />
                    {isSubmitting ? "Menyimpan..." : "Simpan Presensi"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <QrModeCard onCopy={copyAttendanceLink} />
          </div>
        )}
      </main>
    </div>
  );
}

function Field({
  children,
  icon: Icon,
  label,
}: {
  children: ReactNode;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <Icon className="size-4 text-emerald-700" />
        {label}
      </label>
      {children}
    </div>
  );
}

function QrModeCard({ onCopy }: { onCopy: () => void }) {
  return (
    <Card className="rounded-[2rem] border-emerald-100 bg-white shadow-md shadow-slate-900/5">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Mode QR</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
            Tautan presensi siap ditempel
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Tempel QR ini di ruang baca agar pengunjung langsung masuk ke halaman presensi.
          </p>
        </div>

        <div className="mx-auto grid aspect-square w-full max-w-56 grid-cols-7 gap-1 rounded-[1.75rem] border border-emerald-100 bg-emerald-50 p-5">
          {Array.from({ length: 49 }).map((_, index) => (
            <span
              key={index}
              className={cn(
                "rounded-[4px] bg-white",
                (index % 3 === 0 || index % 7 === 2 || index === 24 || index === 40) &&
                  "bg-emerald-800",
                (index < 16 && index % 4 !== 2) ||
                  (index > 32 && index % 5 !== 1) ||
                  (index > 4 && index < 12)
                  ? "bg-emerald-700"
                  : "",
              )}
            />
          ))}
        </div>

        <div className="rounded-3xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
            <Sparkles className="size-4 text-emerald-700" />
            Presensi ruang baca
          </div>
          Gunakan tautan ini untuk membagikan form presensi kunjungan ruang baca.
        </div>

        <Button variant="outline" className="h-11 w-full rounded-2xl bg-white" onClick={onCopy}>
          <Clipboard className="size-4" />
          Salin Tautan Presensi
        </Button>
      </CardContent>
    </Card>
  );
}

function SuccessState({
  onReset,
  record,
}: {
  onReset: () => void;
  record: SubmittedAttendance;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <Card className="overflow-hidden rounded-[2rem] border-emerald-100 bg-white shadow-md shadow-slate-900/5">
        <CardContent className="space-y-6 p-6 text-center sm:p-8">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-10" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Presensi berhasil dicatat
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Terima kasih. Ringkasan kunjungan Anda tampil di bawah ini.
            </p>
          </div>

          <div className="grid gap-3 rounded-3xl bg-slate-50 p-4 text-left sm:grid-cols-3">
            <SummaryItem label="Nama" value={record.name} />
            <SummaryItem label="Keperluan" value={record.purpose} />
            <SummaryItem label="Waktu presensi" value={formatDate(record.visitedAt)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button className="h-11 rounded-2xl bg-emerald-700 hover:bg-emerald-800" onClick={onReset}>
              Isi Presensi Lagi
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-2xl bg-white">
              <Link href="/">Kembali ke Beranda</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{value}</p>
    </div>
  );
}
