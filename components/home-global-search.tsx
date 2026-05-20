"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, GraduationCap, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Book, Thesis } from "@/lib/types";
import { cn } from "@/lib/utils";

type SearchItem =
  | { type: "book"; item: Book; href: string; title: string; meta: string; keywords: string[] }
  | { type: "thesis"; item: Thesis; href: string; title: string; meta: string; keywords: string[] };

const SEARCH_DEBOUNCE_MS = 250;

export function HomeGlobalSearch({ books, theses }: { books: Book[]; theses: Thesis[] }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const searchableItems = useMemo<SearchItem[]>(
    () => [
      ...books.map((item) => ({
        type: "book" as const,
        item,
        href: `/books/${item.id}`,
        title: item.title,
        meta: `${item.author || "Penulis belum tercatat"} - ${item.category || "Buku"}`,
        keywords: [item.author, item.category, item.publisher, item.isbn, ...item.keywords],
      })),
      ...theses.map((item) => ({
        type: "thesis" as const,
        item,
        href: `/theses/${item.id}`,
        title: item.title,
        meta: `${item.studentName || "Mahasiswa"} - ${item.year}`,
        keywords: [
          item.studentName,
          item.topic,
          item.supervisor1,
          item.supervisor2,
          ...item.keywords,
        ],
      })),
    ],
    [books, theses],
  );

  const results = useMemo(() => {
    const keyword = debouncedQuery.toLowerCase();
    if (!keyword) return searchableItems.slice(0, 5);

    return searchableItems
      .filter((entry) =>
        [entry.title, entry.meta, ...entry.keywords]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword)),
      )
      .slice(0, 6);
  }, [debouncedQuery, searchableItems]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="relative rounded-[1.75rem] bg-white p-2 shadow-2xl shadow-emerald-950/20 ring-1 ring-white/70 transition focus-within:shadow-emerald-950/25">
        <Search className="absolute left-6 top-1/2 size-5 -translate-y-1/2 text-emerald-700" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-14 rounded-[1.35rem] border-0 bg-slate-50 pl-12 pr-12 text-base shadow-inner shadow-slate-950/5 focus-visible:ring-2 sm:h-16 sm:text-lg"
          placeholder="Cari judul, penulis, kategori, topik, atau pembimbing"
        />
        {hasQuery ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
            }}
            className="absolute right-6 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Kosongkan pencarian"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 overflow-hidden rounded-[1.5rem] bg-white/95 text-left shadow-xl shadow-slate-950/10 ring-1 ring-white/75 backdrop-blur">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-xs font-medium text-slate-500">
          <span>{hasQuery ? "Hasil pencarian realtime" : "Koleksi terbaru"}</span>
          <span>{results.length} item</span>
        </div>
        <div className="grid max-h-80 overflow-auto p-2">
          {results.length ? (
            results.map((result) => {
              const Icon = result.type === "book" ? BookOpen : GraduationCap;
              return (
                <Link
                  key={`${result.type}-${result.item.id}`}
                  href={result.href}
                  className="group flex items-center gap-3 rounded-2xl p-3 transition hover:bg-emerald-50"
                >
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1",
                      result.type === "book"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                        : "bg-sky-50 text-sky-700 ring-sky-100",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-semibold text-slate-950">
                      {result.title}
                    </span>
                    <span className="mt-1 block line-clamp-1 text-xs text-slate-500">
                      {result.meta}
                    </span>
                  </span>
                  <Badge variant="secondary" className="hidden rounded-full sm:inline-flex">
                    {result.type === "book" ? "Buku" : "Skripsi"}
                  </Badge>
                  <ArrowRight className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" />
                </Link>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Tidak ada koleksi yang cocok.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
