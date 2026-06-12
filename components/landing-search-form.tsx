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

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-3xl items-center gap-2 rounded-full border border-white/50 bg-white/45 p-2 shadow-[0_24px_60px_rgba(8,145,178,0.06)] backdrop-blur-3xl ring-1 ring-slate-200/20 transition-all duration-500 focus-within:-translate-y-1 focus-within:border-yellow-300/80 focus-within:bg-white/75 focus-within:shadow-[0_32px_80px_rgba(8,145,178,0.12)] focus-within:ring-8 focus-within:ring-yellow-500/5"
    >
      <Search className="ml-4 size-5 shrink-0 text-yellow-600/70" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="h-12 min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400 sm:h-14 sm:text-base px-2"
        placeholder="Cari judul, penulis, kategori, topik, atau pembimbing"
      />
      <button
        type="submit"
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-600 via-yellow-600 to-orange-600 px-6 text-sm font-bold text-white shadow-md shadow-red-950/10 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg hover:shadow-red-950/20 active:scale-[0.99] sm:h-12 sm:px-8 border-0"
      >
        <Search className="size-4" />
        Cari
      </button>
    </form>
  );
}
