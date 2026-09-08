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
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs mb-3">
              <Newspaper className="size-3.5 text-slate-500" />
              <span>Publikasi Ilmiah Program Studi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Jurnal Ilmiah Pendidikan Matematika
            </h2>
            <p className="mt-2 text-xs sm:text-sm font-normal text-slate-600 max-w-2xl leading-relaxed">
              Jurnal berkala ilmiah resmi dan wadah publikasi riset sivitas akademika Jurusan Pendidikan Matematika FKIP Universitas Lambung Mangkurat.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-semibold text-amber-900 shadow-2xs">
              <Award className="size-4 text-amber-600" />
              <span>
                Keduanya Terakreditasi{" "}
                <strong className="text-amber-800 font-bold">SINTA 3</strong>
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
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      className="h-full"
    >
      <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
        {/* Top Header: Badge and Tag */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-xs font-bold text-amber-900 shadow-2xs">
            <Award className="size-3.5 text-amber-700" />
            {journal.accreditationBadge}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {journal.tag}
          </span>
        </div>

        {/* Title */}
        <div className="mb-3">
          <h3 className={`text-xl sm:text-2xl font-bold tracking-tight text-slate-900 transition-colors duration-200 ${isEduMat ? "group-hover:text-amber-700" : "group-hover:text-blue-700"}`}>
            {journal.title}
          </h3>
        </div>

        {/* Meta Chips: Frekuensi Terbit & Editor in Chief */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200/50">
            <Calendar className={`size-3.5 ${isEduMat ? "text-amber-600" : "text-blue-600"}`} />
            <span>Terbit: <strong className="text-slate-900 font-semibold">{journal.frequency}</strong></span>
          </div>

          {journal.editorInChief ? (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200/50">
              <span className="text-slate-500">Editor in Chief:</span>
              <strong className="font-semibold text-slate-900">{journal.editorInChief}</strong>
            </div>
          ) : null}
        </div>

        {/* Description Feature Box */}
        <div className="mb-6 rounded-lg border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Profil & Ruang Lingkup
          </p>

          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
            {isEduMat ? (
              <>
                Jurnal ilmiah berkala yang diterbitkan sejak <strong className="text-slate-900 font-semibold">tahun 2013</strong> oleh <strong className="text-slate-900 font-semibold">Program Studi Pendidikan Matematika FKIP ULM</strong>. Memuat artikel hasil penelitian dan kajian orisinal dosen, peneliti, guru, serta mahasiswa dalam lingkup inovasi pembelajaran matematika.
              </>
            ) : (
              <>
                Jurnal ilmiah berkala yang didirikan sejak <strong className="text-slate-900 font-semibold">tahun 2018</strong> oleh <strong className="text-slate-900 font-semibold">Program Studi Pendidikan Matematika FKIP ULM</strong>. Didedikasikan khusus sebagai wadah diseminasi artikel ilmiah hasil riset skripsi mahasiswa S1 bersama dosen pembimbing.
              </>
            )}
          </p>

          <div className="mt-3.5 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-2xs border border-slate-200">
              <Globe className="size-3 text-emerald-600" />
              Open Access (OJS)
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-2xs border border-slate-200">
              <CheckCircle2 className="size-3 text-blue-600" />
              Peer-Reviewed
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-2xs border border-slate-200">
              <GraduationCap className={`size-3 ${isEduMat ? "text-amber-600" : "text-blue-600"}`} />
              {isEduMat ? "Riset Dosen & Peneliti" : "Diseminasi Skripsi S1"}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-2">
          <Button
            asChild
            className={`w-full rounded-lg py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors duration-200 border-0 ${
              isEduMat
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <a
              href={journal.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track("visit_journal", { journal: journal.title, id: journal.id });
              }}
            >
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
