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
      className="mx-auto flex w-full max-w-3xl items-center gap-2 rounded-[1.35rem] bg-white p-2 shadow-xl shadow-slate-950/8 ring-1 ring-slate-200/80"
    >
      <Search className="ml-3 size-5 shrink-0 text-slate-400" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="h-12 min-w-0 flex-1 border-0 bg-transparent text-base font-medium text-slate-800 outline-none placeholder:text-slate-400 sm:h-14"
        placeholder="Cari judul, penulis, kategori, topik, atau pembimbing"
      />
      <button
        type="submit"
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm shadow-emerald-950/15 transition hover:-translate-y-0.5 hover:bg-emerald-800 sm:h-12 sm:px-7"
      >
        <Search className="size-4" />
        Cari
      </button>
    </form>
  );
}
