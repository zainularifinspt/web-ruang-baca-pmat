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
        className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 sm:p-2 shadow-lg shadow-red-950/10 transition-all focus-within:border-red-700 focus-within:ring-4 focus-within:ring-red-500/10"
      >
        <Search className="ml-2.5 sm:ml-3.5 size-4 sm:size-5 shrink-0 text-red-700" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-10 sm:h-12 min-w-0 flex-1 border-0 bg-transparent text-xs sm:text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 px-1.5 sm:px-2"
          placeholder="Cari buku, skripsi, pengarang, atau topik riset..."
        />
        <button
          type="submit"
          className="inline-flex h-9 sm:h-11 shrink-0 items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-red-800 px-4 sm:px-6 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors hover:bg-red-900 cursor-pointer"
        >
          <span>Cari</span>
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs">
        <span className="text-red-200/80 font-medium mr-1 hidden sm:inline">Pencarian populer:</span>
        {quickTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white transition-colors hover:bg-white/20 hover:border-white/40 cursor-pointer"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
