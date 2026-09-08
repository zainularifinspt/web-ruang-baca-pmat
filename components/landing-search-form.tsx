"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function LandingSearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();
    const search = normalizedQuery ? `?q=${encodeURIComponent(normalizedQuery)}` : "";
    router.push(`/katalog${search}`);
  }

  function handleTagClick(tag: string) {
    router.push(`/katalog?q=${encodeURIComponent(tag)}`);
  }

  const quickTags = [
    "Kalkulus",
    "Etnomatematika",
    "Statistika",
    "RME",
    "HOTS",
    "Skripsi 2024",
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form
        onSubmit={handleSubmit}
        className="group relative flex w-full items-center gap-2 rounded-full border border-white/40 bg-white/95 p-1.5 sm:p-2 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.4)] backdrop-blur-2xl transition-all duration-300 focus-within:shadow-[0_25px_60px_-10px_rgba(225,29,72,0.35),0_0_0_2px_rgba(244,63,94,0.5)] focus-within:border-white"
      >
        <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700 ml-1">
          <Search className="size-4 sm:size-5" />
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-10 sm:h-12 min-w-0 flex-1 border-0 bg-transparent text-xs sm:text-base font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 px-2"
          placeholder="Cari buku teks, skripsi S1, pengarang, topik riset..."
        />
        <button
          type="submit"
          className="inline-flex h-10 sm:h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 px-6 sm:px-8 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-0"
        >
          <span>Cari</span>
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-red-100/90 font-medium mr-1 hidden sm:inline">Pencarian populer:</span>
        {quickTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className="apple-glass-pill rounded-full px-3.5 py-1 text-xs font-semibold text-white transition-all hover:bg-white/25 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
