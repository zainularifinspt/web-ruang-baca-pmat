"use client";

import Link from "next/link";
import {
  Award,
  BookMarked,
  Calendar,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  Library,
  Newspaper,
  Send,
  Sparkles,
} from "lucide-react";
import { PRODI_JOURNALS, JournalInfo } from "@/lib/journals-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeIn, FadeInStagger, ScaleIn } from "@/components/ui/framer";

export function JournalShowcase() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header Title */}
      <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/60 bg-orange-50/80 px-3.5 py-1 text-xs font-bold text-orange-800 shadow-xs mb-2">
            <Newspaper className="size-3.5 text-orange-600" />
            <span>Publikasi Ilmiah Program Studi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Jurnal Pendidikan Matematika
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-500 max-w-2xl">
            Jurnal ilmiah resmi dan wadah publikasi karya akademik dosen, peneliti, dan mahasiswa
            Jurusan Pendidikan Matematika FKIP Universitas Lambung Mangkurat.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className="rounded-full border-amber-300/80 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-900 shadow-xs"
          >
            <Award className="mr-1.5 size-3.5 text-amber-600" />
            Keduanya Terakreditasi SINTA 3
          </Badge>
        </div>
      </div>

      {/* Journal Cards Grid */}
      <FadeInStagger className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {PRODI_JOURNALS.map((journal) => (
          <JournalCard key={journal.id} journal={journal} />
        ))}
      </FadeInStagger>
    </section>
  );
}

function JournalCard({ journal }: { journal: JournalInfo }) {
  const isEduMat = journal.id === "edumat";

  return (
    <ScaleIn
      whileHover={{ y: -5, scale: 1.01, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      className="h-full"
    >
      <div className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-6 sm:p-8 shadow-sm transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-orange-950/5 ring-1 ring-slate-200/40">
        {/* Accent Glow Top Border */}
        <div
          className={`absolute inset-x-0 top-0 h-2 ${
            isEduMat
              ? "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400"
              : "bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500"
          }`}
        />

        {/* Top Header: Badge and Tag */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-3 py-1 text-xs font-extrabold text-white shadow-xs">
            <Award className="size-3.5" />
            {journal.accreditationBadge}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {journal.tag}
          </span>
        </div>

        {/* Title & Subtitle */}
        <div className="mb-4">
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors duration-200">
            {journal.title}
          </h3>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-500">
            {journal.subtitle}
          </p>
        </div>

        {/* Meta Grid: ISSN, Frequency, Editor in Chief, DOI */}
        <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-2xl bg-slate-50/80 p-3.5 text-xs text-slate-600 ring-1 ring-slate-100">
          <div className="flex items-center gap-2">
            <BookMarked className="size-4 shrink-0 text-orange-500" />
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">ISSN / Identitas</span>
              <span className="font-semibold text-slate-800">
                {journal.pIssn ? `P: ${journal.pIssn} | E: ${journal.eIssn}` : journal.eIssn}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0 text-amber-500" />
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Frekuensi Terbit</span>
              <span className="font-semibold text-slate-800">{journal.frequency}</span>
            </div>
          </div>

          {journal.editorInChief ? (
            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-1 border-t border-slate-200/60 pt-2 text-[11px] text-slate-600">
              <span>
                <strong className="text-slate-700">Editor in Chief:</strong> {journal.editorInChief}
              </span>
              {journal.doi ? (
                <span className="font-semibold text-orange-600">
                  DOI Prefix: {journal.doi}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Description */}
        <p className="mb-5 text-xs sm:text-sm leading-relaxed text-slate-600 font-medium line-clamp-3">
          {journal.description}
        </p>

        {/* Focus & Scope Pills */}
        <div className="mb-6 flex-1">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Fokus & Ruang Lingkup:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {journal.scope.slice(0, 4).map((item) => (
              <span
                key={item}
                className="rounded-lg bg-slate-100/80 px-2.5 py-1 text-[11px] font-medium text-slate-650 hover:bg-slate-200/70 transition-colors"
              >
                {item}
              </span>
            ))}
            {journal.scope.length > 4 ? (
              <span className="rounded-lg bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-700">
                +{journal.scope.length - 4} lainnya
              </span>
            ) : null}
          </div>
        </div>

        {/* Indexing Badges */}
        <div className="mb-6 border-t border-slate-100 pt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Terindeks Pada:
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {journal.indexing.map((idx) => (
              <span
                key={idx}
                className="rounded-md border border-slate-200/60 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-2xs"
              >
                {idx}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
          <Button
            asChild
            className={`flex-1 rounded-xl text-xs font-bold text-white shadow-sm transition-all duration-200 border-0 ${
              isEduMat
                ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                : "bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800"
            }`}
          >
            <a href={journal.url} target="_blank" rel="noopener noreferrer">
              <Library className="size-4 mr-1.5" />
              Kunjungi Portal OJS
              <ExternalLink className="size-3 ml-1.5 opacity-80" />
            </a>
          </Button>

          <Button
            asChild
            variant="outline"
            className="rounded-xl border-slate-200 bg-white/90 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          >
            <a href={journal.submissionUrl} target="_blank" rel="noopener noreferrer">
              <Send className="size-3.5 mr-1 text-orange-600" />
              Kirim Naskah
            </a>
          </Button>

          {journal.currentIssueUrl ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <a href={journal.currentIssueUrl} target="_blank" rel="noopener noreferrer">
                <FileCheck2 className="size-3.5 mr-1" />
                Edisi Terkini
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </ScaleIn>
  );
}
