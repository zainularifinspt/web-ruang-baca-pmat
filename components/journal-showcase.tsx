"use client";

import {
  Award,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Globe,
  GraduationCap,
  Library,
  Newspaper,
} from "lucide-react";
import { PRODI_JOURNALS, JournalInfo } from "@/lib/journals-data";
import { Button } from "@/components/ui/button";
import { FadeIn, FadeInStagger, ScaleIn } from "@/components/ui/framer";
import { track } from "@vercel/analytics";

export function JournalShowcase() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header Title */}
      <FadeIn>
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200/60 bg-gradient-to-r from-red-50 to-rose-50/60 px-3.5 py-1 text-xs font-bold text-red-900 shadow-2xs mb-3">
              <Newspaper className="size-3.5 text-red-700" />
              <span>Publikasi Ilmiah Program Studi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Jurnal Ilmiah Pendidikan Matematika
            </h2>
            <p className="mt-2 text-xs sm:text-sm font-normal text-slate-600 max-w-2xl leading-relaxed">
              Jurnal berkala ilmiah resmi dan wadah publikasi riset sivitas akademika Jurusan Pendidikan Matematika FKIP Universitas Lambung Mangkurat.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-gradient-to-r from-amber-100/80 via-amber-50 to-amber-100/50 px-4 py-1.5 text-xs font-bold text-amber-950 shadow-2xs">
              <Award className="size-4 text-amber-700" />
              <span>
                Keduanya Terakreditasi{" "}
                <strong className="text-amber-900 font-extrabold">SINTA 3</strong>
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
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 350, damping: 25 } }}
      className="h-full"
    >
      <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/85 bg-white/72 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-900/5 transition-all duration-300 hover:border-red-300/60 hover:bg-white/88 hover:shadow-2xl hover:shadow-red-950/10">
        {/* Subtle Apple ambient radial glow in top right */}
        <div 
          className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-gradient-to-br from-red-500/10 via-rose-500/5 to-transparent blur-3xl transition-opacity duration-300 group-hover:opacity-100 opacity-60" 
          aria-hidden="true" 
        />

        {/* Top Header: Badge and Tag */}
        <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 border border-amber-300/70 px-3 py-1 text-xs font-extrabold text-amber-900 shadow-2xs">
            <Award className="size-3.5 text-amber-700" />
            {journal.accreditationBadge}
          </span>
          <span className="rounded-full bg-white/70 backdrop-blur-sm border border-slate-200/60 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            {journal.tag}
          </span>
        </div>

        {/* Title */}
        <div className="relative z-10 mb-3">
          <h3 className={`text-xl sm:text-2xl font-black tracking-tight text-slate-900 transition-colors duration-200 ${isEduMat ? "group-hover:text-red-800" : "group-hover:text-rose-800"}`}>
            {journal.title}
          </h3>
        </div>

        {/* Meta Chips: Frekuensi Terbit & Editor in Chief */}
        <div className="relative z-10 mb-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-slate-700 border border-white/80 shadow-2xs">
            <Calendar className={`size-3.5 ${isEduMat ? "text-red-700" : "text-rose-700"}`} />
            <span>Terbit: <strong className="text-slate-900 font-bold">{journal.frequency}</strong></span>
          </div>

          {journal.editorInChief ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-3 py-1 text-xs font-medium text-slate-700 border border-white/80 shadow-2xs">
              <span className="text-slate-500">Editor in Chief:</span>
              <strong className="font-bold text-slate-900">{journal.editorInChief}</strong>
            </div>
          ) : null}
        </div>

        {/* Description Feature Box */}
        <div className="relative z-10 mb-6 rounded-2xl border border-white/80 bg-white/60 p-4 sm:p-5 shadow-2xs backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Profil &amp; Ruang Lingkup
          </p>

          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
            {isEduMat ? (
              <>
                Jurnal ilmiah berkala yang diterbitkan sejak <strong className="text-slate-900 font-bold">tahun 2013</strong> oleh <strong className="text-slate-900 font-bold">Program Studi Pendidikan Matematika FKIP ULM</strong>. Memuat artikel hasil penelitian dan kajian orisinal dosen, peneliti, guru, serta mahasiswa dalam lingkup inovasi pembelajaran matematika.
              </>
            ) : (
              <>
                Jurnal ilmiah berkala yang didirikan sejak <strong className="text-slate-900 font-bold">tahun 2018</strong> oleh <strong className="text-slate-900 font-bold">Program Studi Pendidikan Matematika FKIP ULM</strong>. Didedikasikan khusus sebagai wadah diseminasi artikel ilmiah hasil riset skripsi mahasiswa S1 bersama dosen pembimbing.
              </>
            )}
          </p>

          <div className="mt-3.5 pt-3 border-t border-slate-150 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/70 shadow-2xs">
              <Globe className="size-3 text-emerald-600" />
              Open Access (OJS)
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-200/70 shadow-2xs">
              <CheckCircle2 className="size-3 text-blue-600" />
              Peer-Reviewed
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-800 border border-purple-200/70 shadow-2xs">
              <GraduationCap className={`size-3 ${isEduMat ? "text-purple-600" : "text-blue-600"}`} />
              {isEduMat ? "Riset Dosen & Peneliti" : "Diseminasi Skripsi S1"}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="relative z-10 mt-auto pt-2">
          <a
            href={journal.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              track("visit_journal", { journal: journal.title, id: journal.id });
            }}
            style={{ color: "#ffffff" }}
            className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 py-3.5 text-xs sm:text-sm font-extrabold !text-white shadow-md shadow-red-600/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Library className="size-4 mr-2 !text-white shrink-0" />
            <span className="!text-white font-extrabold tracking-wide">Kunjungi OJS Jurnal</span>
            <ExternalLink className="size-3.5 ml-2 !text-white/90 shrink-0 stroke-[2.5]" />
          </a>
        </div>
      </div>
    </ScaleIn>
  );
}
