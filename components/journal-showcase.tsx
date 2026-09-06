"use client";

import {
  Award,
  BookMarked,
  Calendar,
  ExternalLink,
  Library,
  Newspaper,
} from "lucide-react";
import { PRODI_JOURNALS, JournalInfo } from "@/lib/journals-data";
import { Button } from "@/components/ui/button";
import { FadeIn, FadeInStagger, ScaleIn } from "@/components/ui/framer";

export function JournalShowcase() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header Title */}
      <FadeIn>
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3.5 py-1 text-xs font-semibold text-white shadow-xs backdrop-blur-md mb-3 transition-colors hover:bg-white/25">
              <Newspaper className="size-3.5 text-yellow-200" />
              <span>Publikasi Ilmiah Program Studi</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-xs">
              Jurnal Ilmiah{" "}
              <span className="bg-gradient-to-r from-yellow-200 via-yellow-100 to-white bg-clip-text text-transparent">
                Pendidikan Matematika
              </span>
            </h2>
            <p className="mt-2 text-xs sm:text-base font-medium text-white/90 max-w-2xl leading-relaxed">
              Jurnal ilmiah resmi dan wadah publikasi karya akademik dosen, peneliti, dan mahasiswa
              Jurusan Pendidikan Matematika FKIP Universitas Lambung Mangkurat.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-white shadow-sm ring-1 ring-white/10 transition-colors hover:bg-white/25">
              <Award className="size-4 text-yellow-300" />
              <span>
                Keduanya Terakreditasi{" "}
                <span className="text-yellow-200 font-extrabold">SINTA 3</span>
              </span>
            </div>
          </div>
        </div>
      </FadeIn>

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
        <p className="mb-6 text-xs sm:text-sm leading-relaxed text-slate-600 font-medium">
          {journal.description}
        </p>

        {/* Action Button */}
        <div className="mt-auto pt-2">
          <Button
            asChild
            className={`w-full rounded-xl py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all duration-200 border-0 ${
              isEduMat
                ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-orange-500/20 hover:shadow-md hover:shadow-orange-500/30"
                : "bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30"
            }`}
          >
            <a href={journal.url} target="_blank" rel="noopener noreferrer">
              <Library className="size-4 mr-2" />
              Kunjungi Halaman Jurnal
              <ExternalLink className="size-3.5 ml-2 opacity-85" />
            </a>
          </Button>
        </div>
      </div>
    </ScaleIn>
  );
}
