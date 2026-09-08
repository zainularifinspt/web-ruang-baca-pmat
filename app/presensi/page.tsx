"use client";

import { type ComponentType, type FormEvent, type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
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
    <div className="min-h-screen apple-mesh-body text-slate-950">
      <PublicNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Page Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-red-950/40 apple-mesh-hero-subtle p-6 sm:p-10 text-white shadow-xl shadow-red-950/20 mb-8">
          <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 size-80 rounded-full bg-amber-500/15 blur-3xl" />
          
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2 max-w-2xl">
              <div className="apple-glass-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs sm:text-sm font-bold text-white shadow-xs">
                <CalendarCheck className="size-3.5 text-amber-300" />
                <span>Buku Tamu &amp; Presensi Harian</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Presensi Pengunjung Ruang Baca
              </h1>
              <p className="text-xs sm:text-base leading-relaxed text-red-100/90 font-normal">
                Sistem pencatatan kehadiran digital sivitas akademika Jurusan Pendidikan Matematika FKIP Universitas Lambung Mangkurat.
              </p>
            </div>
            <Button asChild variant="outline" className="apple-glass-pill rounded-full text-white hover:bg-white hover:text-red-950 shadow-xs font-bold shrink-0 cursor-pointer border-white/30">
              <Link href="/">
                <ArrowLeft className="size-4 mr-1.5" />
                Kembali ke Beranda
              </Link>
            </Button>
          </div>
        </section>

        {submitted ? (
          <SuccessState record={submitted} onReset={resetForm} />
        ) : (
          <div className="mx-auto w-full max-w-5xl">
            <div className="overflow-hidden rounded-3xl border border-white/85 bg-white/80 backdrop-blur-xl shadow-xl shadow-red-950/8">
              <div>
                <div className="border-b border-red-900/30 bg-gradient-to-r from-red-800 via-rose-800 to-red-950 px-6 py-6 text-white sm:px-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white shadow-xs border border-white/20 backdrop-blur-md">
                        <QrCode className="size-7 text-amber-300" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-red-200">
                          Formulir Presensi Cepat
                        </p>
                        <h2 className="text-lg font-black tracking-tight text-white sm:text-2xl">
                          Catat Kunjungan Anda
                        </h2>
                        <p className="mt-0.5 text-xs sm:text-sm text-red-100/90">
                          Ketik NIM atau NIP Anda. Data nama dan program studi akan terisi otomatis jika sudah tersimpan di sistem.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-900" htmlFor="identifier">
                      NIM / NIP
                    </label>
                    <p className="text-xs text-slate-500">
                      Cukup ketik NIM Anda, data identitas pengunjung akan dicek secara langsung.
                    </p>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-red-700" />
                      <Input
                        id="identifier"
                        value={identifier}
                        onChange={(event) => handleIdentifierChange(event.target.value)}
                        placeholder="Contoh: 2311040007"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50 pl-11 text-base shadow-xs placeholder:text-slate-400 focus-visible:border-red-700 focus-visible:ring-red-700/20"
                      />
                    </div>
                    {matchedUser ? (
                      <div className="flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-xs ring-1 ring-emerald-200">
                        <CheckCircle2 className="size-3.5" />
                        Data ditemukan: {matchedUser.name} ({matchedUser.visitorStatus})
                      </div>
                    ) : isLookupLoading ? (
                      <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                        Mengecek data NIM/NIP...
                      </p>
                    ) : isUnknownIdentifier ? (
                      <div className="flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs ring-1 ring-slate-200">
                        <AlertCircle className="size-3.5 text-slate-500" />
                        NIM belum terdaftar otomatis, silakan lengkapi form di bawah ini.
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nama Pengunjung" icon={UserRound}>
                      <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Nama lengkap pengunjung"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50 shadow-xs placeholder:text-slate-400 focus-visible:border-red-700 focus-visible:ring-red-700/20"
                      />
                    </Field>

                    <Field label="Status Pengunjung" icon={IdCard}>
                      <Select
                        value={visitorStatus}
                        onValueChange={(value) => setVisitorStatus(value as VisitorStatus)}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 shadow-xs focus:ring-red-700/20">
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

                  <Field label="Program Studi / Instansi" icon={GraduationCap}>
                    <Input
                      value={studyProgram}
                      onChange={(event) => setStudyProgram(event.target.value)}
                      placeholder="Contoh: Pendidikan Matematika"
                      className="h-12 rounded-xl border-slate-200 bg-slate-50/50 shadow-xs placeholder:text-slate-400 focus-visible:border-red-700 focus-visible:ring-red-700/20"
                    />
                  </Field>

                  <Field label="Keperluan Kunjungan" icon={LibraryBig}>
                    <Select value={purpose} onValueChange={(value) => setPurpose(value as VisitPurpose)}>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 shadow-xs focus:ring-red-700/20">
                        <SelectValue placeholder="Pilih keperluan kunjungan..." />
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
                    className="h-13 w-full rounded-full bg-gradient-to-r from-red-700 via-red-800 to-rose-900 hover:from-red-800 hover:to-rose-950 text-base font-bold text-white shadow-lg shadow-red-950/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50 border-0"
                    disabled={!canSubmit || isSubmitting}
                    type="submit"
                  >
                    <CalendarCheck className="size-4 mr-2" />
                    {isSubmitting ? "Menyimpan Presensi..." : "Simpan Presensi Kunjungan"}
                  </Button>
                </form>
              </div>
            </div>
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
      <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <Icon className="size-4 text-red-700" />
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
      <Card className="overflow-hidden rounded-3xl border-white/85 bg-white/80 backdrop-blur-xl shadow-xl shadow-red-950/8 ring-1 ring-white/60">
        <CardContent className="space-y-6 p-6 text-center sm:p-8">
          <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-red-50 text-red-800 ring-1 ring-red-200 shadow-xs">
            <CheckCircle2 className="size-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Presensi Berhasil Dicatat!
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Terima kasih telah berkunjung ke Ruang Baca Pendidikan Matematika FKIP ULM.
            </p>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-left sm:grid-cols-3">
            <SummaryItem label="Nama Pengunjung" value={record.name} />
            <SummaryItem label="Keperluan" value={record.purpose} />
            <SummaryItem label="Waktu Presensi" value={formatDate(record.visitedAt)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button className="h-11 rounded-xl bg-red-800 hover:bg-red-900 font-bold text-white shadow-md shadow-red-950/20 cursor-pointer" onClick={onReset}>
              Isi Presensi Lagi
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl border-slate-300 bg-white shadow-xs hover:bg-red-50 hover:text-red-900 hover:border-red-200 font-bold cursor-pointer">
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
