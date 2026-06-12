"use client";

import { type ComponentType, type FormEvent, type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  GraduationCap,
  IdCard,
  LibraryBig,
  QrCode,
  Search,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { PublicNav } from "@/components/public-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { visitPurposes, visitorStatuses } from "@/lib/mock-data";
import type { VisitPurpose, VisitorStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type SubmittedAttendance = {
  identifier: string;
  name: string;
  visitorStatus: VisitorStatus;
  studyProgram: string;
  purpose: VisitPurpose;
  visitedAt: string;
};

type LookupUser = {
  name: string;
  nimNip: string;
  visitorStatus: VisitorStatus;
  studyProgram: string;
};

export default function AttendancePage() {
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [visitorStatus, setVisitorStatus] = useState<VisitorStatus>("Mahasiswa");
  const [studyProgram, setStudyProgram] = useState("Pendidikan Matematika");
  const [purpose, setPurpose] = useState<VisitPurpose | "">("");
  const [submitted, setSubmitted] = useState<SubmittedAttendance | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchedUser, setMatchedUser] = useState<LookupUser | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  useEffect(() => {
    const normalizedIdentifier = identifier.trim();

    if (normalizedIdentifier.length < 4) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLookupLoading(true);

      try {
        const response = await fetch(
          `/api/users/lookup?identifier=${encodeURIComponent(normalizedIdentifier)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const payload = (await response.json()) as { user?: LookupUser | null; error?: string };

        if (!response.ok || payload.error) {
          throw new Error(payload.error ?? "Gagal mencari data pengguna.");
        }

        setMatchedUser(payload.user ?? null);
        if (payload.user) {
          setName(payload.user.name);
          setVisitorStatus(payload.user.visitorStatus);
          setStudyProgram(payload.user.studyProgram || "Pendidikan Matematika");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMatchedUser(null);
      } finally {
        setIsLookupLoading(false);
      }
    }, 320);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [identifier]);

  const isUnknownIdentifier = identifier.trim().length >= 5 && !matchedUser && !isLookupLoading;
  const canSubmit =
    identifier.trim().length >= 4 &&
    name.trim().length >= 3 &&
    studyProgram.trim().length >= 3 &&
    Boolean(purpose);

  function handleIdentifierChange(value: string) {
    setIdentifier(value);
    setMatchedUser(null);
    setIsLookupLoading(value.trim().length >= 4);
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-yellow-50 to-red-50 text-slate-950">
      <div className="pointer-events-none absolute -left-28 top-20 size-80 rounded-full bg-yellow-200 opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-40 size-96 rounded-full bg-red-200 opacity-35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 size-80 rounded-full bg-violet-200 opacity-25 blur-3xl" />
      <PublicNav />
      <main className="relative mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl space-y-3">
            <Badge className="rounded-full border-red-100 bg-white/85 px-3 py-1 text-red-700 shadow-sm backdrop-blur">
              <CalendarCheck className="mr-1.5 size-3.5" />
              Presensi Ruang Baca
            </Badge>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Presensi Kunjungan Ruang Baca
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Isi NIM atau identitas singkat untuk mencatat kunjungan.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="rounded-full border-slate-200 bg-white/90 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-700">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Beranda
            </Link>
          </Button>
        </div>

        {submitted ? (
          <SuccessState record={submitted} onReset={resetForm} />
        ) : (
          <div className="mx-auto w-full max-w-5xl">
            <Card className="overflow-hidden rounded-3xl border-white/80 bg-white/85 shadow-xl shadow-slate-950/10 backdrop-blur">
              <CardContent className="p-0">
                <div className="border-b border-red-100 bg-gradient-to-br from-red-700 via-rose-700 to-yellow-700 px-5 py-6 text-white sm:px-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white shadow-sm ring-1 ring-white/25 backdrop-blur">
                        <QrCode className="size-7" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-50">
                          Form presensi cepat
                        </p>
                        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                          Catat kunjungan dalam satu menit
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-red-50">
                          Cukup ketik NIM/NIP, lalu nama dan status pengunjung akan muncul otomatis jika data sudah diimport admin.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-8">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-800" htmlFor="identifier">
                      NIM/NIP
                    </label>
                    <p className="text-sm leading-6 text-slate-500">
                      Pengunjung hanya perlu mengetik NIM/NIP. Nama, status, dan program studi akan terisi otomatis dari data presensi.
                    </p>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-red-600/70" />
                      <Input
                        id="identifier"
                        value={identifier}
                        onChange={(event) => handleIdentifierChange(event.target.value)}
                        placeholder="Contoh: 2311040007"
                        className="h-12 rounded-2xl border-slate-200 bg-white/90 pl-11 text-base shadow-sm placeholder:text-slate-400 focus-visible:border-yellow-300 focus-visible:ring-yellow-500/20"
                      />
                    </div>
                    {matchedUser ? (
                      <div className="flex w-fit items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm ring-1 ring-red-100">
                        <CheckCircle2 className="size-3.5" />
                        Data ditemukan
                      </div>
                    ) : isLookupLoading ? (
                      <p className="rounded-2xl bg-yellow-50 px-3 py-2 text-sm text-yellow-800 ring-1 ring-yellow-100">
                        Mencari data NIM/NIP...
                      </p>
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
                        className="h-12 rounded-2xl border-slate-200 bg-white/90 shadow-sm placeholder:text-slate-400 focus-visible:border-yellow-300 focus-visible:ring-yellow-500/20"
                      />
                    </Field>

                    <Field label="Status pengunjung" icon={IdCard}>
                      <Select
                        value={visitorStatus}
                        onValueChange={(value) => setVisitorStatus(value as VisitorStatus)}
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white/90 shadow-sm focus:ring-yellow-500/20">
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
                      className="h-12 rounded-2xl border-slate-200 bg-white/90 shadow-sm placeholder:text-slate-400 focus-visible:border-yellow-300 focus-visible:ring-yellow-500/20"
                    />
                  </Field>

                  <Field label="Keperluan kunjungan" icon={LibraryBig}>
                    <Select value={purpose} onValueChange={(value) => setPurpose(value as VisitPurpose)}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white/90 shadow-sm focus:ring-yellow-500/20">
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
                    className="h-12 w-full rounded-full bg-gradient-to-r from-red-700 via-rose-700 to-yellow-700 text-base font-bold text-white shadow-lg shadow-red-950/15 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-950/20 disabled:translate-y-0 disabled:shadow-sm"
                    disabled={!canSubmit || isSubmitting}
                    type="submit"
                  >
                    <CalendarCheck className="size-4" />
                    {isSubmitting ? "Menyimpan..." : "Simpan Presensi"}
                  </Button>
                </form>
              </CardContent>
            </Card>
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
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Icon className="size-4 text-red-600" />
        {label}
      </label>
      {children}
    </div>
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
      <Card className="overflow-hidden rounded-3xl border-white/80 bg-white/85 shadow-xl shadow-slate-950/10 backdrop-blur">
        <CardContent className="space-y-6 p-6 text-center sm:p-8">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-yellow-100 text-red-700 shadow-sm ring-1 ring-red-100">
            <CheckCircle2 className="size-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Presensi berhasil dicatat
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Terima kasih. Ringkasan kunjungan Anda tampil di bawah ini.
            </p>
          </div>

          <div className="grid gap-3 rounded-3xl border border-slate-200/70 bg-slate-50/70 p-4 text-left sm:grid-cols-3">
            <SummaryItem label="Nama" value={record.name} />
            <SummaryItem label="Keperluan" value={record.purpose} />
            <SummaryItem label="Waktu presensi" value={formatDate(record.visitedAt)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button className="h-11 rounded-full bg-gradient-to-r from-red-700 via-rose-700 to-yellow-700 font-bold text-white shadow-lg shadow-red-950/15 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-950/20" onClick={onReset}>
              Isi Presensi Lagi
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-full border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-700">
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
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{value}</p>
    </div>
  );
}
