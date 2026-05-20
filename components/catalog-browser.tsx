"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowUpDown, Search, SlidersHorizontal, X } from "lucide-react";
import { CollectionCard } from "@/components/collection-card";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupabaseClient } from "@/lib/supabase";
import type { Book, Thesis, VerificationStatus } from "@/lib/types";
import { valueToUIStatus } from "@/lib/utils";

type CatalogTab = "all" | "books" | "theses";
type SortValue = "newest" | "oldest" | "title";
type VerificationFilter = VerificationStatus | "all";
type CollectionItem = Book | Thesis;
type FilterOption = {
  label: string;
  value: string;
};
const SEARCH_DEBOUNCE_MS = 350;

export function CatalogBrowser({
  books,
  theses,
  initialTab = "books",
  initialQuery = "",
  initialVerificationStatus = "all",
  showAllTab = false,
  itemActions,
  enableRealtime = true,
}: {
  books: Book[];
  theses: Thesis[];
  initialTab?: CatalogTab;
  initialQuery?: string;
  initialVerificationStatus?: VerificationFilter;
  showAllTab?: boolean;
  itemActions?: (item: CollectionItem) => ReactNode;
  enableRealtime?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [tab, setTab] = useState<CatalogTab>(initialTab);
  const [sort, setSort] = useState<SortValue>("newest");
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationFilter>(initialVerificationStatus);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [bookCategory, setBookCategory] = useState("all");
  const [bookLocation, setBookLocation] = useState("all");
  const [bookAvailability, setBookAvailability] = useState("all");

  const [thesisYear, setThesisYear] = useState("all");
  const [thesisTopic, setThesisTopic] = useState("all");
  const [thesisAdvisor, setThesisAdvisor] = useState("all");

  useEffect(() => {
    return () => {
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    const normalizedInput = query.trim();

    if (normalizedInput === debouncedQuery.trim()) return;

    searchTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
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

  const filteredBooks = useMemo(() => {
    const result = books.filter((item) => {
      const matchesQuery = matchesSearch(item, normalizedQuery);
      const matchesStatus = matchesVerificationStatus(item, verificationStatus);
      const matchesCategory = bookCategory === "all" || item.category === bookCategory;
      const matchesLocation = bookLocation === "all" || item.rackLocation === bookLocation;
      const availability = getAvailabilityValue(item);
      const matchesAvailability =
        bookAvailability === "all" || availability === bookAvailability;
      return matchesQuery && matchesStatus && matchesCategory && matchesLocation && matchesAvailability;
    });
    return sortCollections(result, sort);
  }, [books, normalizedQuery, verificationStatus, bookCategory, bookLocation, bookAvailability, sort]);

  const filteredTheses = useMemo(() => {
    const result = theses.filter((item) => {
      const matchesQuery = matchesSearch(item, normalizedQuery);
      const matchesStatus = matchesVerificationStatus(item, verificationStatus);
      const matchesYear = thesisYear === "all" || String(item.year) === thesisYear;
      const matchesTopic = thesisTopic === "all" || item.keywords.includes(thesisTopic);
      const matchesAdvisor =
        thesisAdvisor === "all" ||
        item.supervisor1 === thesisAdvisor ||
        item.supervisor2 === thesisAdvisor;
      return matchesQuery && matchesStatus && matchesYear && matchesTopic && matchesAdvisor;
    });
    return sortCollections(result, sort);
  }, [theses, normalizedQuery, verificationStatus, thesisYear, thesisTopic, thesisAdvisor, sort]);

  const filteredAll = useMemo(
    () => sortCollections([...filteredBooks, ...filteredTheses], sort),
    [filteredBooks, filteredTheses, sort],
  );

  const bookCategories = useMemo(() => unique(books.map((item) => item.category)), [books]);
  const bookLocations = useMemo(() => unique(books.map((item) => item.rackLocation)), [books]);
  const thesisYears = useMemo(() => unique(theses.map((item) => String(item.year))), [theses]);
  const thesisTopics = useMemo(() => unique(theses.flatMap((item) => item.keywords)), [theses]);
  const thesisAdvisors = useMemo(
    () => unique(theses.flatMap((item) => [item.supervisor1, item.supervisor2])),
    [theses],
  );

  const activeChips =
    tab === "books"
      ? [
          chip("Status", verificationStatusLabel(verificationStatus), () => setVerificationStatus("all"), verificationStatus),
          chip("Kategori", bookCategory, () => setBookCategory("all")),
          chip("Lokasi", bookLocation, () => setBookLocation("all")),
          chip("Ketersediaan", availabilityLabel(bookAvailability), () => setBookAvailability("all"), bookAvailability),
        ]
      : tab === "theses"
        ? [
          chip("Status", verificationStatusLabel(verificationStatus), () => setVerificationStatus("all"), verificationStatus),
          chip("Tahun", thesisYear, () => setThesisYear("all")),
          chip("Topik", thesisTopic, () => setThesisTopic("all")),
          chip("Pembimbing", thesisAdvisor, () => setThesisAdvisor("all")),
        ]
        : [
          chip("Status", verificationStatusLabel(verificationStatus), () => setVerificationStatus("all"), verificationStatus),
        ];

  const resetCurrentFilters = () => {
    triggerLoading();
    setVerificationStatus(initialVerificationStatus);
    if (tab === "books") {
      setBookCategory("all");
      setBookLocation("all");
      setBookAvailability("all");
    } else {
      setThesisYear("all");
      setThesisTopic("all");
      setThesisAdvisor("all");
    }
  };

  const currentCount =
    tab === "all"
      ? filteredAll.length
      : tab === "books"
        ? filteredBooks.length
        : filteredTheses.length;
  const hasQuery = query.trim().length > 0;
  const isSearchLoading = query.trim() !== debouncedQuery.trim();
  const isLoading = isFilterLoading || isSearchLoading;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Katalog Digital</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">
              Temukan referensi ruang baca
            </h2>
          </div>
          <Badge variant="secondary" className="w-fit rounded-full">
            {isLoading ? "Mencari..." : `${currentCount} hasil ditemukan`}
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="Cari judul atau penulis"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-12 pr-12 text-base shadow-inner shadow-slate-900/3 sm:h-14"
          />
          {hasQuery ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setDebouncedQuery("");
              }}
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700"
              aria-label="Kosongkan pencarian"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value === "theses" ? "theses" : "books");
          triggerLoading();
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <TabsList
            className={
              showAllTab
                ? "grid h-12 w-full grid-cols-3 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200/70 sm:w-[32rem]"
                : "grid h-12 w-full grid-cols-2 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200/70 sm:w-96"
            }
          >
            {showAllTab ? <TabsTrigger value="all">Semua</TabsTrigger> : null}
            <TabsTrigger value="books">Buku</TabsTrigger>
            <TabsTrigger value="theses">Skripsi</TabsTrigger>
          </TabsList>
          <Select value={sort} onValueChange={(value) => {
            setSort(value as SortValue);
            triggerLoading();
          }}>
            <SelectTrigger className="h-11 w-full rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 sm:w-56">
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

        <div className="mt-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <SlidersHorizontal className="size-4 text-primary" />
            Filter koleksi
          </div>

          <TabsContent value="all" className="m-0">
            <VerificationStatusFilter
              value={verificationStatus}
              onValueChange={(value) => {
                setVerificationStatus(value);
                triggerLoading();
              }}
            />
          </TabsContent>

          <TabsContent value="books" className="m-0">
            <div className="grid gap-3 xl:grid-cols-[220px_1fr]">
              <VerificationStatusFilter
                value={verificationStatus}
                onValueChange={(value) => {
                  setVerificationStatus(value);
                  triggerLoading();
                }}
              />
              <BookFilters
                categories={bookCategories}
                locations={bookLocations}
                category={bookCategory}
                location={bookLocation}
                availability={bookAvailability}
                onCategory={(value) => {
                  setBookCategory(value);
                  triggerLoading();
                }}
                onLocation={(value) => {
                  setBookLocation(value);
                  triggerLoading();
                }}
                onAvailability={(value) => {
                  setBookAvailability(value);
                  triggerLoading();
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="theses" className="m-0">
            <div className="grid gap-3 xl:grid-cols-[220px_1fr]">
              <VerificationStatusFilter
                value={verificationStatus}
                onValueChange={(value) => {
                  setVerificationStatus(value);
                  triggerLoading();
                }}
              />
              <ThesisFilters
                years={thesisYears}
                topics={thesisTopics}
                advisors={thesisAdvisors}
                year={thesisYear}
                topic={thesisTopic}
                advisor={thesisAdvisor}
                onYear={(value) => {
                  setThesisYear(value);
                  triggerLoading();
                }}
                onTopic={(value) => {
                  setThesisTopic(value);
                  triggerLoading();
                }}
                onAdvisor={(value) => {
                  setThesisAdvisor(value);
                  triggerLoading();
                }}
              />
            </div>
          </TabsContent>

          <FilterChips chips={activeChips} onReset={resetCurrentFilters} />
        </div>

        {showAllTab ? (
          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <CatalogSkeleton />
            ) : (
              <CollectionGrid
                items={filteredAll}
                itemActions={itemActions}
                empty="Koleksi tidak ditemukan."
                description="Coba gunakan kata kunci lain, ubah status verifikasi, atau reset filter yang aktif."
              />
            )}
          </TabsContent>
        ) : null}

        <TabsContent value="books" className="mt-6">
          {isLoading ? (
            <CatalogSkeleton />
          ) : (
            <CollectionGrid
              items={filteredBooks}
              itemActions={itemActions}
              empty={
                books.length
                  ? "Buku tidak ditemukan."
                  : "Belum ada data buku dari Supabase."
              }
              description={
                books.length
                  ? "Coba gunakan kata kunci lain, ubah filter, atau reset pilihan yang aktif."
                  : "Katalog buku akan tampil otomatis setelah tabel books memiliki data."
              }
            />
          )}
        </TabsContent>
        <TabsContent value="theses" className="mt-6">
          {isLoading ? (
            <CatalogSkeleton />
          ) : (
            <CollectionGrid
              items={filteredTheses}
              itemActions={itemActions}
              empty={
                theses.length
                  ? "Skripsi tidak ditemukan."
                  : "Belum ada data skripsi dari Supabase."
              }
              description={
                theses.length
                  ? "Coba gunakan kata kunci lain, ubah filter, atau reset pilihan yang aktif."
                  : "Repositori skripsi akan tampil otomatis setelah tabel theses memiliki data."
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookFilters({
  categories,
  locations,
  category,
  location,
  availability,
  onCategory,
  onLocation,
  onAvailability,
}: {
  categories: string[];
  locations: string[];
  category: string;
  location: string;
  availability: string;
  onCategory: (value: string) => void;
  onLocation: (value: string) => void;
  onAvailability: (value: string) => void;
}) {
  const categoryOptions: FilterOption[] = categories.map((cat) => ({
    label: cat,
    value: cat,
  }));
  const locationOptions: FilterOption[] = locations.map((loc) => ({
    label: loc,
    value: loc,
  }));
  const availabilityOptions: FilterOption[] = [
    { label: "Tersedia", value: "available" },
    { label: "Terbatas", value: "limited" },
    { label: "Tidak tersedia", value: "empty" },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <FilterSelect label="Kategori" value={category} onValueChange={onCategory} options={categoryOptions} placeholder="Semua kategori" />
      <FilterSelect label="Lokasi rak" value={location} onValueChange={onLocation} options={locationOptions} placeholder="Semua lokasi" />
      <FilterSelect
        label="Ketersediaan"
        value={availability}
        onValueChange={onAvailability}
        placeholder="Semua ketersediaan"
        options={availabilityOptions}
      />
    </div>
  );
}

function ThesisFilters({
  years,
  topics,
  advisors,
  year,
  topic,
  advisor,
  onYear,
  onTopic,
  onAdvisor,
}: {
  years: string[];
  topics: string[];
  advisors: string[];
  year: string;
  topic: string;
  advisor: string;
  onYear: (value: string) => void;
  onTopic: (value: string) => void;
  onAdvisor: (value: string) => void;
}) {
  const yearOptions: FilterOption[] = years.map((y) => ({
    label: y,
    value: y,
  }));
  const topicOptions: FilterOption[] = topics.map((t) => ({
    label: t,
    value: t,
  }));
  const advisorOptions: FilterOption[] = advisors.map((a) => ({
    label: a,
    value: a,
  }));
  
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <FilterSelect label="Tahun" value={year} onValueChange={onYear} options={yearOptions} placeholder="Semua tahun" />
      <FilterSelect label="Topik" value={topic} onValueChange={onTopic} options={topicOptions} placeholder="Semua topik" />
      <FilterSelect label="Dosen pembimbing" value={advisor} onValueChange={onAdvisor} options={advisorOptions} placeholder="Semua pembimbing" />
    </div>
  );
}

function VerificationStatusFilter({
  value,
  onValueChange,
}: {
  value: VerificationFilter;
  onValueChange: (value: VerificationFilter) => void;
}) {
  return (
    <FilterSelect
      label="Status verifikasi"
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as VerificationFilter)}
      placeholder="Semua status"
      options={[
        { label: "Disetujui", value: "approved" },
        { label: "Menunggu Verifikasi", value: "pending" },
        { label: "Ditolak", value: "rejected" },
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
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: FilterOption[];
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{placeholder}</SelectItem>
          {options.map((option) => (
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
          className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100"
        >
          {item.label}: {item.value}
          <X className="size-3" />
        </button>
      ))}
      <Button variant="ghost" size="sm" className="h-8 rounded-full" onClick={onReset}>
        Reset filter
      </Button>
    </div>
  );
}

function CollectionGrid({
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
    return (
      <EmptyState
        title={empty}
        description={description}
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((item) => {
        const actions = itemActions?.(item);

        return (
          <div key={item.id} className="space-y-3">
            <CollectionCard item={item} />
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-[330px] animate-pulse rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"
        >
          <div className="h-28 rounded-2xl bg-slate-100" />
          <div className="mt-5 h-4 w-4/5 rounded bg-slate-100" />
          <div className="mt-3 h-3 w-3/5 rounded bg-slate-100" />
          <div className="mt-8 grid gap-3">
            <div className="h-3 rounded bg-slate-100" />
            <div className="h-3 rounded bg-slate-100" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getAvailabilityValue(item: Book) {
  if (item.available <= 0) return "empty";
  if (item.available <= Math.max(1, item.stock / 2)) return "limited";
  return "available";
}

function availabilityLabel(value: string) {
  const labels: Record<string, string> = {
    all: "all",
    available: "Tersedia",
    limited: "Terbatas",
    empty: "Tidak tersedia",
  };
  return labels[value] ?? value;
}

function verificationStatusLabel(value: VerificationFilter) {
  return value === "all" ? "all" : valueToUIStatus(value);
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
      ? [item.title, item.author, item.category, item.publisher, item.isbn, ...item.keywords]
      : [
          item.title,
          item.studentName,
          item.topic,
          item.supervisor1,
          item.supervisor2,
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

function chip(
  label: string,
  value: string,
  clear: () => void,
  rawValue = value,
) {
  return { label, value, clear, rawValue };
}
