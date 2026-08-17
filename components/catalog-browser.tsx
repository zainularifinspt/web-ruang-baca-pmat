"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  BookMarked,
  BookOpen,
  Calendar,
  Eye,
  GraduationCap,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { CollectionDetailContent } from "@/components/collection-detail";
import { EmptyState } from "@/components/empty-state";
import { AvailabilityBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSupabaseClient } from "@/lib/supabase";
import type { Book, Thesis, VerificationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type CatalogTab = "all" | "books" | "theses";
type SortValue = "newest" | "oldest" | "title";
type VerificationFilter = VerificationStatus | "all";
type CollectionItem = Book | Thesis;
type PageSize = 10 | 25 | 50;
type FilterOption = {
  label: string;
  value: string;
};

const SEARCH_DEBOUNCE_MS = 350;

export function CatalogBrowser({
  books,
  theses,
  initialTab = "all",
  initialQuery = "",
  initialVerificationStatus = "all",
  showAllTab = true,
  itemActions,
  toolbar,
  enableRealtime = true,
}: {
  books: Book[];
  theses: Thesis[];
  initialTab?: CatalogTab;
  initialQuery?: string;
  initialVerificationStatus?: VerificationFilter;
  showAllTab?: boolean;
  itemActions?: (item: CollectionItem) => ReactNode;
  toolbar?: ReactNode;
  enableRealtime?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [collectionType, setCollectionType] = useState<CatalogTab>(initialTab);
  const [sort, setSort] = useState<SortValue>("newest");
  const [yearFilter, setYearFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [locationAdvisorFilter, setLocationAdvisorFilter] = useState("all");
  const [bookAvailability, setBookAvailability] = useState("all");
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get("q")?.trim() ?? "";
    const urlTab = params.get("tab");
    const nextTab: CatalogTab =
      urlTab === "books" || urlTab === "theses" ? urlTab : initialTab;
    const frame = window.requestAnimationFrame(() => {
      if (urlQuery && !initialQuery) {
        setQuery(urlQuery);
        setDebouncedQuery(urlQuery);
      }

      if (nextTab !== initialTab) {
        setCollectionType(nextTab);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [initialQuery, initialTab]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    const normalizedInput = query.trim();
    if (normalizedInput === debouncedQuery.trim()) return;

    searchTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [debouncedQuery, query]);

  useEffect(() => {
    if (!enableRealtime) return;

    let supabase: ReturnType<typeof getSupabaseClient>;

    try {
      supabase = getSupabaseClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel("catalog-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "books" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "theses" },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enableRealtime, router]);

  const triggerLoading = () => {
    setIsFilterLoading(true);
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    loadingTimer.current = setTimeout(() => setIsFilterLoading(false), 260);
  };

  const normalizedQuery = useMemo(() => debouncedQuery.trim().toLowerCase(), [debouncedQuery]);

  const baseItems = useMemo(() => {
    const items: CollectionItem[] =
      collectionType === "books"
        ? books
        : collectionType === "theses"
          ? theses
          : [...books, ...theses];

    return items.filter((item) => matchesVerificationStatus(item, initialVerificationStatus));
  }, [books, collectionType, initialVerificationStatus, theses]);

  const filteredItems = useMemo(() => {
    const result = baseItems.filter((item) => {
      const matchesQuery = matchesSearch(item, normalizedQuery);
      const matchesYear = yearFilter === "all" || String(item.year) === yearFilter;
      const matchesSubject =
        subjectFilter === "all" ||
        (item.type === "book"
          ? item.category === subjectFilter || item.keywords.includes(subjectFilter.toLowerCase())
          : item.topic === subjectFilter || item.keywords.includes(subjectFilter.toLowerCase()));
      const matchesLocationAdvisor =
        locationAdvisorFilter === "all" ||
        (item.type === "book"
          ? item.rackLocation === locationAdvisorFilter || item.location === locationAdvisorFilter
          : item.supervisor1 === locationAdvisorFilter ||
            item.supervisor2 === locationAdvisorFilter ||
            item.physicalLocation === locationAdvisorFilter);
      const matchesAvailability =
        item.type !== "book" ||
        bookAvailability === "all" ||
        getAvailabilityValue(item) === bookAvailability;

      return matchesQuery && matchesYear && matchesSubject && matchesLocationAdvisor && matchesAvailability;
    });

    return sortCollections(result, sort);
  }, [baseItems, bookAvailability, locationAdvisorFilter, normalizedQuery, sort, subjectFilter, yearFilter]);

  const subjectOptions = useMemo(
    () =>
      unique(
        baseItems
          .map((item) => (item.type === "book" ? item.category : item.topic))
          .filter(Boolean),
      ),
    [baseItems],
  );

  const yearOptions = useMemo(() => unique(baseItems.map((item) => String(item.year))), [baseItems]);
  const locationAdvisorOptions = useMemo(
    () =>
      unique(
        baseItems.flatMap((item) => {
          if (collectionType === "theses" && item.type === "thesis") {
            return [item.supervisor1, item.supervisor2];
          }
          return item.type === "book"
            ? [item.rackLocation, item.location]
            : [item.supervisor1, item.supervisor2, item.physicalLocation];
        }),
      ),
    [baseItems, collectionType],
  );

  const activeChips = useMemo(() => {
    if (collectionType === "books") {
      return [
        chip("Jenis", collectionTypeLabel(collectionType), () => setCollectionType("all"), collectionType),
        chip("Mata Kuliah", subjectFilter, () => setSubjectFilter("all")),
      ];
    }
    if (collectionType === "theses") {
      return [
        chip("Jenis", collectionTypeLabel(collectionType), () => setCollectionType("all"), collectionType),
        chip("Tahun", yearFilter, () => setYearFilter("all")),
        chip("Pembimbing", locationAdvisorFilter, () => setLocationAdvisorFilter("all")),
      ];
    }
    return [
      chip("Jenis", collectionTypeLabel(collectionType), () => setCollectionType("all"), collectionType),
      chip("Mata Kuliah / Topik", subjectFilter, () => setSubjectFilter("all")),
      chip("Tahun", yearFilter, () => setYearFilter("all")),
      chip("Pembimbing", locationAdvisorFilter, () => setLocationAdvisorFilter("all")),
    ];
  }, [collectionType, locationAdvisorFilter, subjectFilter, yearFilter]);

  const resetCurrentFilters = () => {
    triggerLoading();
    setCollectionType(showAllTab ? "all" : initialTab);
    setYearFilter("all");
    setSubjectFilter("all");
    setLocationAdvisorFilter("all");
    setBookAvailability("all");
    setPage(1);
  };

  const hasQuery = query.trim().length > 0;
  const isSearchLoading = query.trim() !== debouncedQuery.trim();
  const isLoading = isFilterLoading || isSearchLoading;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startItem = filteredItems.length ? (safePage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(safePage * pageSize, filteredItems.length);
  const paginatedItems = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
      {toolbar ? toolbar : null}

      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Katalog Digital</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">
              Temukan referensi ruang baca
            </h2>
          </div>
          <Badge variant="secondary" className="w-fit rounded-full">
            {isLoading ? "Mencari..." : `${filteredItems.length} hasil ditemukan`}
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="Cari judul, penulis, topik, atau mata kuliah..."
            className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-12 pr-12 text-base shadow-inner shadow-slate-900/3 sm:h-14"
          />
          {hasQuery ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setDebouncedQuery("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700"
              aria-label="Kosongkan pencarian"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <SlidersHorizontal className="size-4 text-primary" />
          Filter koleksi
        </div>

        {/* Filter Bar: Khusus Buku hanya Jenis & Mata Kuliah */}
        <div
          className={cn(
            "grid gap-3",
            collectionType === "books" ? "sm:grid-cols-2" : "lg:grid-cols-3",
          )}
        >
          <CollectionTypeFilter
            value={collectionType}
            showAll={showAllTab || initialTab === "all"}
            onValueChange={(value) => {
              setCollectionType(value);
              setSubjectFilter("all");
              setYearFilter("all");
              setLocationAdvisorFilter("all");
              if (value !== "books") setBookAvailability("all");
              setPage(1);
              triggerLoading();
            }}
          />

          {/* Khusus Buku / E-Book: Filter Mata Kuliah */}
          {collectionType === "books" ? (
            <FilterSelect
              label="Mata Kuliah"
              value={subjectFilter}
              onValueChange={(value) => {
                setSubjectFilter(value);
                setPage(1);
                triggerLoading();
              }}
              options={subjectOptions.map(toOption)}
              placeholder="Semua mata kuliah"
            />
          ) : null}

          {/* Khusus Skripsi: Filter Tahun & Pembimbing */}
          {collectionType === "theses" ? (
            <>
              <FilterSelect
                label="Tahun"
                value={yearFilter}
                onValueChange={(value) => {
                  setYearFilter(value);
                  setPage(1);
                  triggerLoading();
                }}
                options={yearOptions.map(toOption)}
                placeholder="Semua tahun"
              />
              <FilterSelect
                label="Pembimbing"
                value={locationAdvisorFilter}
                onValueChange={(value) => {
                  setLocationAdvisorFilter(value);
                  setPage(1);
                  triggerLoading();
                }}
                options={locationAdvisorOptions.map(toOption)}
                placeholder="Semua pembimbing"
              />
            </>
          ) : null}

          {/* Jika Semua Koleksi: Tampilkan Filter Kategori, Tahun, & Pembimbing */}
          {collectionType === "all" ? (
            <>
              <FilterSelect
                label="Kategori / Topik"
                value={subjectFilter}
                onValueChange={(value) => {
                  setSubjectFilter(value);
                  setPage(1);
                  triggerLoading();
                }}
                options={subjectOptions.map(toOption)}
                placeholder="Semua kategori / topik"
              />
              <FilterSelect
                label="Tahun"
                value={yearFilter}
                onValueChange={(value) => {
                  setYearFilter(value);
                  setPage(1);
                  triggerLoading();
                }}
                options={yearOptions.map(toOption)}
                placeholder="Semua tahun"
              />
            </>
          ) : null}
        </div>

        <FilterChips chips={activeChips} onReset={resetCurrentFilters} />
      </div>

      <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-500">
          {filteredItems.length ? (
            <>
              Menampilkan <span className="font-semibold text-slate-800">{startItem}-{endItem}</span> dari{" "}
              <span className="font-semibold text-slate-800">{filteredItems.length}</span> koleksi
            </>
          ) : (
            "Tidak ada koleksi yang cocok dengan filter."
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value) as PageSize);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-11 rounded-2xl bg-slate-50 sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 baris</SelectItem>
              <SelectItem value="25">25 baris</SelectItem>
              <SelectItem value="50">50 baris</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value as SortValue);
              setPage(1);
              triggerLoading();
            }}
          >
            <SelectTrigger className="h-11 rounded-2xl bg-slate-50 sm:w-44">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="size-4 text-slate-500" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Terbaru</SelectItem>
              <SelectItem value="oldest">Terlama</SelectItem>
              <SelectItem value="title">Judul A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <CatalogSkeleton />
      ) : (
        <CollectionRows
          items={paginatedItems}
          itemActions={itemActions}
          empty="Koleksi tidak ditemukan."
          description="Coba gunakan kata kunci lain, ubah filter, atau reset pilihan yang aktif."
        />
      )}

      <PaginationControls
        page={safePage}
        totalPages={totalPages}
        disabled={!filteredItems.length}
        onPageChange={setPage}
      />
    </div>
  );
}

function CollectionTypeFilter({
  value,
  showAll,
  onValueChange,
}: {
  value: CatalogTab;
  showAll: boolean;
  onValueChange: (value: CatalogTab) => void;
}) {
  return (
    <FilterSelect
      label="Jenis koleksi"
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as CatalogTab)}
      placeholder="Semua koleksi"
      options={[
        ...(showAll ? [{ label: "Semua koleksi", value: "all" }] : []),
        { label: "E-Book & Buku", value: "books" },
        { label: "Skripsi", value: "theses" },
      ]}
    />
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: FilterOption[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{placeholder}</SelectItem>
          {options
            .filter((option) => option.value !== "all")
            .map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FilterChips({
  chips,
  onReset,
}: {
  chips: Array<{ label: string; value: string; clear: () => void; rawValue: string }>;
  onReset: () => void;
}) {
  const active = chips.filter((item) => item.rawValue !== "all");
  if (!active.length) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
      {active.map((item) => (
        <button
          key={`${item.label}-${item.value}`}
          type="button"
          onClick={item.clear}
          className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-900 ring-1 ring-orange-200"
        >
          {item.label}: {item.value}
          <X className="size-3" />
        </button>
      ))}
      <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs" onClick={onReset}>
        Reset filter
      </Button>
    </div>
  );
}

function CollectionRows({
  items,
  itemActions,
  empty,
  description,
}: {
  items: CollectionItem[];
  itemActions?: (item: CollectionItem) => ReactNode;
  empty: string;
  description: string;
}) {
  if (!items.length) {
    return <EmptyState title={empty} description={description} />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <CollectionRow
          key={`${item.type}-${item.id}`}
          item={item}
          actions={itemActions?.(item)}
        />
      ))}
    </div>
  );
}

function CollectionRow({
  item,
  actions,
}: {
  item: CollectionItem;
  actions?: ReactNode;
}) {
  const isBook = item.type === "book";
  const isEbook = isBook && (item.isEbook || Boolean(item.pdfUrl));
  const Icon = isEbook ? BookOpen : isBook ? BookMarked : GraduationCap;
  const subtitle = isBook ? item.author : item.studentName;

  return (
    <Dialog>
      <div
        className={cn(
          "grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 transition hover:shadow-md items-center",
          isEbook
            ? "ring-orange-200/80 hover:ring-orange-300"
            : isBook
              ? "ring-slate-200/75 hover:ring-red-200"
              : "ring-slate-200/75 hover:ring-amber-200",
          isBook
            ? "grid-cols-[minmax(0,1.8fr)_auto_auto] sm:grid-cols-[minmax(0,2fr)_minmax(140px,1fr)_auto]"
            : "lg:grid-cols-[minmax(0,1.8fr)_7rem_minmax(14rem,1fr)_auto]",
        )}
      >
        <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
          {isBook ? (
            <BookCover
              coverUrl={item.coverUrl}
              title={item.title}
              size="md"
            />
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1 shadow-xs bg-slate-900 text-red-200 ring-slate-900">
              <Icon className="size-6" />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-950">
              {item.title}
            </h3>
            <MetaLine icon={UserRound} value={subtitle} className="mt-1 text-xs font-medium text-slate-600" />
          </div>
        </div>

        {isBook ? (
          <div className="flex flex-col items-center justify-center text-center px-2 sm:px-4">
            <span className="text-xs sm:text-sm font-semibold text-slate-700 line-clamp-2">
              {item.category || "-"}
            </span>
          </div>
        ) : (
          <>
            <div className="grid gap-1 text-xs text-slate-600">
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Tahun</p>
              <MetaLine icon={Calendar} value={String(item.year || 2024)} />
            </div>

            <div className="grid gap-1 text-xs text-slate-600">
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Pembimbing</p>
              <div className="grid gap-0.5 text-xs text-slate-700">
                <p className="line-clamp-1 font-medium">{item.supervisor1 || "-"}</p>
                <p className="line-clamp-1 text-slate-500">{item.supervisor2 || "-"}</p>
              </div>
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-2 justify-end">
          <DialogTrigger asChild>
            <Button
              variant={isEbook ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-xl gap-1.5 font-bold cursor-pointer h-9 px-4 shrink-0",
                isEbook
                  ? "bg-gradient-to-r from-red-600 via-yellow-600 to-orange-600 text-white shadow-xs hover:brightness-110 border-0"
                  : "",
              )}
            >
              {isEbook ? (
                <>
                  <BookOpen className="size-3.5" />
                  <span>Baca E-Book</span>
                </>
              ) : (
                <>
                  <Eye className="size-3.5" />
                  <span>Detail</span>
                </>
              )}
            </Button>
          </DialogTrigger>
          {actions}
        </div>
      </div>
      <CollectionDetailContent item={item} />
    </Dialog>
  );
}

function CatalogSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70"
        >
          <div className="h-4 w-4/5 rounded bg-slate-100" />
          <div className="mt-3 h-4 w-3/5 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  disabled,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Halaman <span className="font-semibold text-slate-800">{page}</span> dari{" "}
        <span className="font-semibold text-slate-800">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ArrowLeft className="size-4" />
          Sebelumnya
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Berikutnya
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function getAvailabilityValue(item: Book) {
  if (item.available <= 0) return "empty";
  if (item.available <= Math.max(1, item.stock / 2)) return "limited";
  return "available";
}

function collectionTypeLabel(value: CatalogTab) {
  const labels: Record<CatalogTab, string> = {
    all: "Semua koleksi",
    books: "E-Book & Buku",
    theses: "Skripsi",
  };
  return labels[value];
}

function sortCollections<T extends Book | Thesis>(items: T[], sort: SortValue) {
  return [...items].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "oldest") return a.year - b.year;
    return b.year - a.year;
  });
}

function matchesVerificationStatus(item: Book | Thesis, status: VerificationFilter) {
  return status === "all" || item.verificationStatus === status;
}

function matchesSearch(item: Book | Thesis, normalizedQuery: string) {
  if (!normalizedQuery) return true;

  const searchableFields =
    item.type === "book"
      ? [item.title, item.author, item.category, item.publisher, item.isbn, item.rackLocation, ...item.keywords]
      : [
          item.title,
          item.studentName,
          item.topic,
          item.supervisor1,
          item.supervisor2,
          item.physicalLocation,
          ...item.keywords,
        ];

  return searchableFields
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

function unique<T extends string>(values: T[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function toOption(value: string) {
  return { label: value, value };
}

function chip(
  label: string,
  value: string,
  clear: () => void,
  rawValue = value,
) {
  return { label, value, clear, rawValue };
}

function MetaLine({
  icon: Icon,
  value,
  className,
}: {
  icon: typeof UserRound;
  value: string;
  className?: string;
}) {
  return (
    <p className={cn("flex min-w-0 items-center gap-2 text-sm text-slate-600", className)}>
      <Icon className="size-4 shrink-0 text-slate-400" />
      <span className="truncate">{value || "-"}</span>
    </p>
  );
}
