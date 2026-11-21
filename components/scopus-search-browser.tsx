"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe2,
  Library,
  Loader2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ScopusArticle, ScopusSearchResponse } from "@/lib/scopus";
import { scopusSearchIdentity } from "@/lib/scopus-export";
import { ScopusAdvancedQuery } from "@/components/scopus-advanced-query";
import { ScopusExportPanel } from "@/components/scopus-export-panel";

export function ScopusSearchBrowser() {
  const [query, setQuery] = useState("");
  const [queryMode, setQueryMode] = useState<"basic" | "advanced">("basic");
  const [advancedQuery, setAdvancedQuery] = useState("");
  const [submittedMode, setSubmittedMode] = useState<"basic" | "advanced">("basic");
  const [sort, setSort] = useState<"relevance" | "newest" | "citations">("relevance");
  const [page, setPage] = useState(1);

  // Advanced Filters State
  const [searchField, setSearchField] = useState<"title" | "all" | "author">("title");
  const [year, setYear] = useState("all");
  const [language, setLanguage] = useState("all");
  const [docType, setDocType] = useState("all");
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [data, setData] = useState<ScopusSearchResponse | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [searchError, setSearchError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [selection, setSelection] = useState<{ key: string; articles: Record<string, ScopusArticle> }>({ key: "", articles: {} });
  const hasSearched = submittedQuery !== null;
  const effectiveFilters = submittedMode === "advanced" ? { searchField: "all", year: "all", language: "all", docType: "all", openAccessOnly: false } : { searchField, year, language, docType, openAccessOnly };
  const searchIdentity = scopusSearchIdentity({ query: submittedQuery, queryMode: submittedMode, ...effectiveFilters });
  const selected = selection.key === searchIdentity ? selection.articles : {};
  const currentYear = new Date().getFullYear();
  const requestKey = JSON.stringify({ query: submittedQuery, queryMode: submittedMode, sort, page, ...effectiveFilters, revision });

  const hasActiveFilters =
    year !== "all" ||
    language !== "all" ||
    docType !== "all" ||
    openAccessOnly ||
    searchField !== "title";

  function fetchResults(
    searchQuery: string,
    sortMode: "relevance" | "newest" | "citations",
    pageNum: number,
    fieldMode: "title" | "all" | "author" = searchField,
    mode: "basic" | "advanced" = "basic",
  ) {
    if (scopusSearchIdentity({ query: searchQuery.trim(), queryMode: mode, searchField: fieldMode, year, language, docType, openAccessOnly }) !== searchIdentity) resetSelection();
    setSubmittedQuery(searchQuery.trim());
    setSubmittedMode(mode);
    setSort(sortMode);
    setPage(pageNum);
    if (mode === "basic") setSearchField(fieldMode);
    setRevision((value) => value + 1);
  }

  useEffect(() => {
    const options = JSON.parse(requestKey);
    if (options.query === null) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      q: options.query,
      queryMode: options.queryMode,
      sort: options.sort,
      page: String(options.page),
      pageSize: "25",
      searchField: options.searchField,
      year: options.year,
      language: options.language,
      docType: options.docType,
      openAccess: String(options.openAccessOnly),
    });
    async function load() {
      setIsPending(true);
      setSearchError("");
      try {
        const response = await fetch(`/api/scopus?${params}`, { signal: controller.signal, cache: "no-store" });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "Gagal memuat artikel Scopus. Silakan coba lagi.");
        if (!controller.signal.aborted) setData(json);
      } catch (error) {
        if (!controller.signal.aborted) {
          setData(null);
          setSearchError(error instanceof Error ? error.message : "Gagal memuat artikel Scopus. Silakan coba lagi.");
        }
      } finally {
        if (!controller.signal.aborted) setIsPending(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [requestKey]);

  function resetSelection() {
    setSelection({ key: "", articles: {} });
  }

  function toggleArticle(article: ScopusArticle) {
    setSelection((previous) => {
      const articles = previous.key === searchIdentity ? { ...previous.articles } : {};
      if (articles[article.id]) delete articles[article.id];
      else articles[article.id] = article;
      return { key: searchIdentity, articles };
    });
  }

  function togglePage() {
    if (!data || data.isDemo) return;
    const allSelected = data.articles.every((article) => selected[article.id]);
    setSelection((previous) => {
      const articles = previous.key === searchIdentity ? { ...previous.articles } : {};
      for (const article of data.articles) {
        if (allSelected) delete articles[article.id];
        else articles[article.id] = article;
      }
      return { key: searchIdentity, articles };
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() && !hasActiveFilters) {
      toast.info("Silakan masukkan kata kunci judul artikel terlebih dahulu");
      return;
    }
    setPage(1);
    fetchResults(query, sort, 1, searchField);
  }

  function handleResetFilters() {
    resetSelection();
    setYear("all");
    setLanguage("all");
    setDocType("all");
    setOpenAccessOnly(false);
    setSearchField("title");
    setSort("relevance");
    setPage(1);
    if (!query.trim()) {
      setSubmittedQuery(null);
      setIsPending(false);
      setData(null);
    }
  }


  return (
    <div className="relative z-20 mx-auto max-w-6xl px-4 -mt-12 sm:-mt-16 pb-12 sm:pb-16 sm:px-6">
      {/* Search Bar & Controls */}
      <fieldset disabled={isExporting} className="min-w-0 rounded-[2.25rem] border border-white/70 bg-white/90 p-4 sm:p-6 shadow-xl shadow-red-950/5 ring-1 ring-slate-200/80 backdrop-blur-xl mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 p-1" aria-label="Mode pencarian">
            {(["basic", "advanced"] as const).map((mode) => <button key={mode} type="button" aria-pressed={queryMode === mode} onClick={() => {
              setQueryMode(mode);
              if (mode === "advanced" && !advancedQuery) setAdvancedQuery(data?.search?.executedQuery ?? "");
            }} className={`min-h-9 rounded-lg px-3.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-red-800 sm:text-sm ${queryMode === mode ? "bg-white text-red-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>{mode === "basic" ? "Pencarian biasa" : "Advanced query"}</button>)}
          </div>
          <span className="hidden text-xs text-slate-500 sm:block">{queryMode === "advanced" ? "Susun strategi pencarian literatur Anda" : "Temukan artikel dari kata kunci"}</span>
        </div>
        {queryMode === "advanced" ? <ScopusAdvancedQuery value={advancedQuery} onChange={setAdvancedQuery} onSearch={() => fetchResults(advancedQuery, sort, 1, "all", "advanced")} isPending={isPending} /> : <>
        <form onSubmit={handleSearchSubmit} className="relative mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-2">
          <div className="relative w-full flex-1">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-red-700/70" />
            <input
              type="text"
              aria-label="Kata kunci pencarian Scopus"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari berdasarkan judul artikel di Scopus (contoh: realistic mathematics education, ethnomathematics)..."
              className="h-12 sm:h-14 w-full rounded-full border border-slate-200/80 bg-white pl-12 pr-10 text-xs sm:text-base font-semibold text-slate-800 shadow-inner outline-none transition-all placeholder:font-normal placeholder:text-slate-500 focus:border-red-700 focus:ring-4 focus:ring-red-700/10"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  resetSelection();
                  setQuery("");
                  setPage(1);
                  if (!hasActiveFilters) {
                    setSubmittedQuery(null);
                    setIsPending(false);
                    setData(null);
                  } else {
                    fetchResults("", sort, 1, searchField);
                  }
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="h-12 sm:h-14 w-full sm:w-auto shrink-0 rounded-full bg-gradient-to-r from-red-700 via-red-800 to-rose-900 hover:from-red-800 hover:to-rose-950 px-6 sm:px-8 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-red-950/25 border-0 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Search className="size-4 mr-1.5" />
            )}
            <span>Cari Scopus</span>
          </Button>
        </form>

        {/* Filter Toggle Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                hasActiveFilters || showFilters
                  ? "bg-red-50 text-red-900 ring-1 ring-red-200"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Filter &amp; Opsi Pencarian</span>
              {hasActiveFilters ? (
                <span className="size-2 rounded-full bg-red-700" />
              ) : null}
            </button>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50/80 border border-red-200/70 px-3 py-1 text-[11px] font-bold text-red-900">
              <BookOpen className="size-3 text-red-700" />
              {searchField === "title"
                ? "Cakupan: Hanya Judul Artikel"
                : searchField === "author"
                ? "Cakupan: Nama Penulis"
                : "Cakupan: Judul, Abstrak & Keyword"}
            </span>
          </div>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-800 cursor-pointer"
            >
              <RotateCcw className="size-3" />
              <span>Reset Filter</span>
            </button>
          ) : null}
        </div>

        {/* Expandable Advanced Filters Box */}
        {showFilters ? (
          <div className="mt-3 rounded-2xl bg-slate-50/90 p-4 border border-slate-200/70 text-xs animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Cakupan Pencarian */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cari Pada:</label>
                <select
                  value={searchField}
                  onChange={(e) => {
                    resetSelection();
                    const val = e.target.value as "title" | "all" | "author";
                    setSearchField(val);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 font-semibold text-slate-800 outline-none focus:border-red-600"
                >
                  <option value="title">Hanya Judul (Default - Paling Akurat)</option>
                  <option value="all">Semua (Judul, Abstrak, Keyword)</option>
                  <option value="author">Nama Penulis (Author)</option>
                </select>
              </div>

              {/* Filter Tahun */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tahun Terbit:</label>
                <select
                  value={year}
                  onChange={(e) => {
                    resetSelection();
                    setYear(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 font-semibold text-slate-800 outline-none focus:border-red-600"
                >
                  <option value="all">Semua Tahun</option>
                  <option value="last3">3 Tahun Terakhir ({currentYear - 2}–{currentYear})</option>
                  <option value="last5">5 Tahun Terakhir ({currentYear - 4}–{currentYear})</option>
                  {Array.from({ length: Math.max(1, currentYear - 2019) }, (_, index) => currentYear - index).map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>

              {/* Filter Bahasa */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bahasa Publikasi:</label>
                <select
                  value={language}
                  onChange={(e) => {
                    resetSelection();
                    setLanguage(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 font-semibold text-slate-800 outline-none focus:border-red-600"
                >
                  <option value="all">Semua Bahasa</option>
                  <option value="english">English (Inggris)</option>
                  <option value="indonesian">Indonesian (Indonesia)</option>
                </select>
              </div>

              {/* Filter Tipe Dokumen */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipe Dokumen:</label>
                <select
                  value={docType}
                  onChange={(e) => {
                    resetSelection();
                    setDocType(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 font-semibold text-slate-800 outline-none focus:border-red-600"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="ar">Artikel Jurnal (Article)</option>
                  <option value="cp">Prosiding Konferensi (Conference)</option>
                  <option value="re">Review Paper</option>
                  <option value="bk">Buku / Book Chapter</option>
                </select>
              </div>

              {/* Filter Open Access */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Akses Dokumen:</label>
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={openAccessOnly}
                    onChange={(e) => {
                      resetSelection();
                      setOpenAccessOnly(e.target.checked);
                      setPage(1);
                    }}
                    className="size-4 rounded accent-red-700 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-700">Hanya Open Access</span>
                </label>
              </div>
            </div>
          </div>
        ) : null}
        </>}
      </fieldset>

      {!isPending && data?.isDemo && (
        <div role="status" className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
          <p className="font-bold">Mode simulasi — ekspor penelitian dinonaktifkan</p>
          <p className="mt-1">{data.message || "Scopus belum terhubung. Artikel berikut merupakan data contoh."} Hubungkan Scopus lalu ulangi pencarian untuk mengekspor hasil asli.</p>
        </div>
      )}

      {/* Meta Filter Bar (Result Count & Sort) */}
      {hasSearched ? (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="text-xs sm:text-sm font-semibold text-slate-600 flex flex-wrap items-center gap-2">
            <Globe2 className="size-4 text-red-700 shrink-0" />
            <span>
              {isPending
                ? "Sedang mencari artikel Scopus..."
                : searchError ? "Pencarian belum berhasil" : `Ditemukan ${data?.totalResults?.toLocaleString("id-ID") ?? 0} publikasi${data?.isDemo ? " simulasi" : " internasional"}`}
            </span>
            {!isPending ? (
              <Badge variant="outline" className="text-[11px] font-bold border-red-200 text-red-900 bg-red-50/80">
                {submittedMode === "advanced" ? "Advanced query" : searchField === "title"
                  ? "Pencarian Judul"
                  : searchField === "author"
                  ? "Pencarian Penulis"
                  : "Pencarian Lengkap"}
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <span>Urutkan:</span>
              <select
                value={sort}
                disabled={isExporting}
                onChange={(e) => {
                  setSort(e.target.value as "relevance" | "newest" | "citations");
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-red-600"
              >
                <option value="relevance">Paling Relevan</option>
                <option value="newest">Terbitan Terbaru</option>
                <option value="citations">Sitasi Terbanyak</option>
              </select>
            </div>
          </div>
        </div>
      ) : null}

      {!searchError && hasSearched && data && data.articles.length > 0 && (
        <div hidden={isPending}>
        <ScopusExportPanel
          key={searchIdentity}
          data={data}
          selected={Object.values(selected)}
          allOnPageSelected={data.articles.every((article) => Boolean(selected[article.id]))}
          onTogglePage={togglePage}
          onClear={() => setSelection({ key: searchIdentity, articles: {} })}
          onBusyChange={setIsExporting}
        />
        </div>
      )}

      {/* Content Area: Initial Hero or Articles List */}
      {!hasSearched ? (
        <div className="rounded-[2.25rem] border border-dashed border-red-200/90 bg-gradient-to-b from-white/95 via-red-50/25 to-amber-50/15 p-8 sm:p-14 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-red-100 text-red-800 ring-4 ring-red-600/10">
            <Search className="size-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
            {queryMode === "advanced" ? "Bangun pencarian literatur yang terarah" : "Pencarian Literatur Scopus Berdasarkan Judul"}
          </h3>
          <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm text-slate-600 leading-relaxed">
            {queryMode === "advanced" ? "Gabungkan field dan operator Scopus di editor. Buka panduan untuk menyisipkan field atau menggunakan contoh query." : <>Ketik kata kunci judul artikel di kolom pencarian di atas, lalu tekan tombol <strong>Cari Scopus</strong> atau tekan Enter.</>}
          </p>
          {queryMode === "basic" && <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Contoh judul riset:</span>
            <button
              type="button"
              onClick={() => {
                setQuery("realistic mathematics education");
                setPage(1);
                fetchResults("realistic mathematics education", sort, 1, searchField);
              }}
              className="rounded-full bg-white px-3 py-1 font-semibold text-red-900 ring-1 ring-red-200 hover:bg-red-50 shadow-2xs cursor-pointer transition-colors"
            >
              realistic mathematics education
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery("ethnomathematics");
                setPage(1);
                fetchResults("ethnomathematics", sort, 1, searchField);
              }}
              className="rounded-full bg-white px-3 py-1 font-semibold text-red-900 ring-1 ring-red-200 hover:bg-red-50 shadow-2xs cursor-pointer transition-colors"
            >
              ethnomathematics
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery("mathematical problem solving");
                setPage(1);
                fetchResults("mathematical problem solving", sort, 1, searchField);
              }}
              className="rounded-full bg-white px-3 py-1 font-semibold text-red-900 ring-1 ring-red-200 hover:bg-red-50 shadow-2xs cursor-pointer transition-colors"
            >
              mathematical problem solving
            </button>
          </div>}
        </div>
      ) : isPending ? (
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-44 animate-pulse rounded-[1.75rem] border border-slate-100 bg-white/70 p-6"
            />
          ))}
        </div>
      ) : searchError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-900">
          <p>{searchError}</p>
          <Button type="button" variant="outline" className="mt-3 rounded-xl" onClick={() => setRevision((value) => value + 1)}>Coba lagi</Button>
        </div>
      ) : data?.articles && data.articles.length > 0 ? (
        <div className="grid gap-4 sm:gap-5">
          {data.articles.map((article) => (
            <ArticleCard key={article.id} article={article} isDemo={data.isDemo} selected={Boolean(selected[article.id])} selectionDisabled={isExporting || data.isDemo} onToggle={() => toggleArticle(article)} />
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/60 p-12 text-center">
          <Library className="mx-auto size-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada artikel yang cocok</h3>
          <p className="mt-1 text-xs text-slate-500">
            Coba sesuaikan kata kunci pencarian atau ubah filter tahun / tipe dokumen di atas.
          </p>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isPending || isExporting}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border-slate-200 text-xs font-bold"
          >
            <ChevronLeft className="size-4 mr-1" />
            Sebelumnya
          </Button>

          <span className="text-xs font-bold text-slate-600 px-2">
            Halaman {page} dari {data.totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages || isPending || isExporting}
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            className="rounded-xl border-slate-200 text-xs font-bold"
          >
            Berikutnya
            <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ArticleCard({
  article, isDemo, selected, selectionDisabled, onToggle,
}: {
  article: ScopusArticle;
  isDemo: boolean;
  selected: boolean;
  selectionDisabled: boolean;
  onToggle: () => void;
}) {
  const articleUrl = article.doiUrl || article.scopusUrl;

  return (
    <div className="group relative flex flex-col justify-between apple-bento-card p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:border-red-300/80 hover:shadow-xl hover:shadow-red-950/8">
      <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-red-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        <div>
          <label className="mb-3 flex w-fit cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
            <input type="checkbox" checked={selected} disabled={selectionDisabled} onChange={onToggle} aria-label={`Pilih artikel: ${article.title}`} className="size-4 accent-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700" />
            {selected ? "Terpilih untuk ekspor" : "Pilih untuk ekspor"}
          </label>
          {/* Top Badges */}
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-2xs">
              {isDemo ? "Data simulasi" : "Scopus Indexed"}
            </span>

            <span className="rounded-full bg-slate-100/90 border border-slate-200/70 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-2xs">
              {article.aggregationType || "Journal"}
            </span>

            {article.openAccess ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200/70 shadow-2xs">
                Open Access
              </span>
            ) : null}

            {article.year ? (
              <span className="text-xs font-bold text-slate-600 ml-auto">{article.year}</span>
            ) : null}
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-red-800 transition-colors leading-snug">
            {articleUrl ? (
              <a
                href={articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-start gap-1"
              >
                <span>{article.title}</span>
              </a>
            ) : (
              article.title
            )}
          </h3>

          {/* Authors & Journal */}
          <div className="mt-2 text-xs text-slate-600 space-y-1">
            <p className="flex items-center gap-1.5 font-medium" title={article.authors}>
              <Users className="size-3.5 text-slate-400 shrink-0" />
              <span className="line-clamp-2">{article.authors}</span>
            </p>
            <p className="flex items-center gap-1.5 font-semibold text-slate-700">
              <BookOpen className="size-3.5 text-red-700 shrink-0" />
              <span>
                {article.journal}
                {article.volume ? `, Vol. ${article.volume}` : ""}
                {article.pages ? `, Hal. ${article.pages}` : ""}
              </span>
            </p>
          </div>

          {/* Affiliation if available */}
          {article.affiliations.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {article.affiliations.slice(0, 2).map((aff) => (
                <span
                  key={aff}
                  className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-200/60 shadow-2xs"
                >
                  {aff}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Bottom Actions Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100/80 pt-3">
          {/* Citation Count Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 px-3 py-1 text-xs font-bold text-amber-950 border border-amber-300/70 shadow-2xs">
            <Star className="size-3.5 text-amber-600 fill-amber-500" />
            <span>{article.citedByCount} Sitasi Scopus</span>
          </div>

          {/* Action Link: Buka Artikel */}
          {articleUrl ? (
            <div className="flex items-center gap-2">
              <a
                href={articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-700 via-red-800 to-rose-900 hover:from-red-800 hover:to-rose-950 px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold !text-white shadow-md shadow-red-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-950/30 active:translate-y-0 no-underline cursor-pointer border-0"
              >
                <span className="!text-white font-black tracking-tight drop-shadow-xs">
                  Buka Artikel
                </span>
                <ExternalLink className="size-3.5 !text-white stroke-[2.5] transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
