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
      className="mx-auto flex w-full max-w-3xl items-center gap-2 rounded-full border border-white/80 bg-white/76 p-2 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl ring-1 ring-slate-200/45 transition duration-300 focus-within:-translate-y-0.5 focus-within:border-cyan-200 focus-within:bg-white/90 focus-within:ring-cyan-500/10"
    >
      <Search className="ml-3 size-5 shrink-0 text-emerald-600/70" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="h-12 min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400 sm:h-14 sm:text-base"
        placeholder="Cari judul, penulis, kategori, topik, atau pembimbing"
      />
      <button
        type="submit"
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#047857,#0891b2_60%,#7c3aed)] px-5 text-sm font-bold text-white shadow-lg shadow-emerald-950/[0.18] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-950/20 active:scale-[0.99] sm:h-12 sm:px-7"
      >
        <Search className="size-4" />
        Cari
      </button>
    </form>
  );
}
