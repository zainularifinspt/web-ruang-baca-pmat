"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, BookOpen, Globe2, GraduationCap, Layers, Search, Sparkles } from "lucide-react";

export function LandingSearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "books" | "theses" | "scopus">("all");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();
    const qParam = normalizedQuery ? `q=${encodeURIComponent(normalizedQuery)}` : "";

    if (category === "scopus") {
      router.push(`/scopus${qParam ? `?${qParam}` : ""}`);
    } else if (category === "books") {
      router.push(`/katalog?tab=books${qParam ? `&${qParam}` : ""}`);
    } else if (category === "theses") {
      router.push(`/katalog?tab=theses${qParam ? `&${qParam}` : ""}`);
    } else {
      router.push(`/katalog${qParam ? `?${qParam}` : ""}`);
    }
  }

  function handleTagClick(tag: string) {
    if (category === "scopus") {
      router.push(`/scopus?q=${encodeURIComponent(tag)}`);
    } else {
      router.push(`/katalog?q=${encodeURIComponent(tag)}`);
    }
  }

  const quickPrompts = [
    "Kalkulus",
    "Etnomatematika",
    "Statistika",
    "RME",
    "HOTS",
    "Skripsi 2024",
  ];

  return (
    <div className="mx-auto w-full max-w-2xl sm:max-w-3xl">
      {/* Pitch-Style Glowing White Prompt Card */}
      <form
        onSubmit={handleSubmit}
        className="group relative rounded-3xl bg-white p-4 sm:p-5.5 text-left shadow-[0_30px_70px_-15px_rgba(0,0,0,0.65),0_0_50px_rgba(244,63,94,0.3)] ring-1 ring-white/40 border border-slate-100 transition-all duration-300 focus-within:shadow-[0_35px_80px_-12px_rgba(0,0,0,0.7),0_0_65px_rgba(244,63,94,0.45)] focus-within:ring-2 focus-within:ring-rose-400"
      >
        {/* Top Input Area with Prompt Styling */}
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-700 mt-0.5 shadow-2xs">
            <Search className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full border-0 bg-transparent text-sm sm:text-base md:text-lg font-bold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 pt-1.5"
              placeholder="Cari buku teks, repositori skripsi, publikasi Scopus..."
              autoComplete="off"
            />
          </div>

          {/* Miniature Ecosystem Indicators in Card Top Right (Pitch Style) */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0 pt-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200/80">
              <Sparkles className="size-3 text-red-600" />
              Ruang Baca
            </span>
          </div>
        </div>

        {/* Bottom Toolbar Row (Pitch Style: Category + Prompts on Left, Generate/Search on Right) */}
        <div className="mt-4 sm:mt-5 pt-3.5 border-t border-slate-150/70 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Category Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                category === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setCategory("books")}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                category === "books"
                  ? "bg-red-800 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <BookOpen className="size-3" />
              <span>Buku</span>
            </button>
            <button
              type="button"
              onClick={() => setCategory("theses")}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                category === "theses"
                  ? "bg-rose-800 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <GraduationCap className="size-3" />
              <span>Skripsi</span>
            </button>
            <button
              type="button"
              onClick={() => setCategory("scopus")}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                category === "scopus"
                  ? "bg-amber-800 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Globe2 className="size-3" />
              <span>Scopus</span>
            </button>
          </div>

          {/* Right: Submit Button (Pitch-style Generate Button with Arrow) */}
          <button
            type="submit"
            className="inline-flex h-10 sm:h-11 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 px-6 sm:px-7 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-0"
          >
            <span>Cari</span>
            <ArrowUpRight className="size-4 stroke-[2.5]" />
          </button>
        </div>
      </form>

      {/* Prompts / Popular Topics (Below the card) */}
      <div className="mt-4.5 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-rose-200 font-semibold mr-1 text-xs flex items-center gap-1.5 drop-shadow-xs">
          <Sparkles className="size-3.5 text-amber-300" />
          <span>Topik Populer:</span>
        </span>
        {quickPrompts.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className="rounded-full bg-white/15 hover:bg-white/25 border border-white/25 px-3.5 py-1 text-xs font-semibold text-white shadow-xs backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Subtitle Below Card (Pitch style) */}
      <p className="mx-auto mt-6 max-w-2xl text-sm sm:text-base leading-relaxed text-rose-100/95 font-medium text-center drop-shadow-sm">
        Pusat literatur ilmiah, repositori skripsi S1, dan eksplorasi jurnal Scopus bereputasi Jurusan Pendidikan Matematika FKIP Universitas Lambung Mangkurat.
      </p>
    </div>
  );
}
