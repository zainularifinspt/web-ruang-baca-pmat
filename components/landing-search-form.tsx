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
      className="mx-auto flex w-full max-w-3xl items-center gap-2 rounded-full border border-white/60 bg-white/80 p-2 shadow-sm ring-1 ring-slate-200/20 transition-colors duration-200 focus-within:border-yellow-300/80 focus-within:bg-white focus-within:ring-8 focus-within:ring-yellow-500/5"
    >
      <Search className="ml-2.5 sm:ml-4 size-4.5 sm:size-5 shrink-0 text-yellow-600/70" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="h-11 min-w-0 flex-1 border-0 bg-transparent text-xs sm:text-base font-semibold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400 sm:h-14 px-1.5 sm:px-2"
        placeholder="Cari judul, penulis, skripsi, atau topik..."
      />
      <button
        type="submit"
        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-gradient-to-r from-red-600 via-yellow-600 to-orange-600 px-4 sm:px-8 text-xs sm:text-sm font-bold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99] sm:h-12 border-0"
      >
        <Search className="size-3.5 sm:size-4" />
        <span>Cari</span>
      </button>
    </form>
  );
}
