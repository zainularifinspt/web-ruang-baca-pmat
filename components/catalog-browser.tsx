"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { books, theses } from "@/lib/mock-data";
import type { Book, Thesis } from "@/lib/types";

type CatalogTab = "books" | "theses";
type SortValue = "newest" | "oldest" | "title";

export function CatalogBrowser({
  initialTab = "books",
}: {
  initialTab?: CatalogTab;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<CatalogTab>(initialTab);
  const [sort, setSort] = useState<SortValue>("newest");
  const [isLoading, setIsLoading] = useState(false);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [bookCategory, setBookCategory] = useState("all");
  const [bookLocation, setBookLocation] = useState("all");
  const [bookAvailability, setBookAvailability] = useState("all");

  const [thesisYear, setThesisYear] = useState("all");
  const [thesisTopic, setThesisTopic] = useState("all");
  const [thesisAdvisor, setThesisAdvisor] = useState("all");
  const [thesisStatus, setThesisStatus] = useState("all");

  useEffect(() => {
    return () => {
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
    };
  }, []);

  const triggerLoading = () => {
    setIsLoading(true);
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    loadingTimer.current = setTimeout(() => setIsLoading(false), 260);
  };

  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

  const filteredBooks = useMemo(() => {
    const result = books.filter((item) => {
      const matchesQuery = [item.title, item.author, item.category, item.location, item.year, ...item.keywords]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesCategory = bookCategory === "all" || item.category === bookCategory;
      const matchesLocation = bookLocation === "all" || item.location === bookLocation;
      const availability = getAvailabilityValue(item);
      const matchesAvailability =
        bookAvailability === "all" || availability === bookAvailability;
      return matchesQuery && matchesCategory && matchesLocation && matchesAvailability;
    });
    return sortCollections(result, sort);
  }, [normalizedQuery, bookCategory, bookLocation, bookAvailability, sort]);

  const filteredTheses = useMemo(() => {
    const result = theses.filter((item) => {
      const matchesQuery = [item.title, item.authorName, item.supervisor1, item.supervisor2, item.year, item.verificationStatus, ...item.keywords]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesYear = thesisYear === "all" || String(item.year) === thesisYear;
      const matchesTopic = thesisTopic === "all" || item.keywords.includes(thesisTopic);
      const matchesAdvisor =
        thesisAdvisor === "all" ||
        item.supervisor1 === thesisAdvisor ||
        item.supervisor2 === thesisAdvisor;
      const matchesStatus =
        thesisStatus === "all" || item.verificationStatus === thesisStatus;
      return matchesQuery && matchesYear && matchesTopic && matchesAdvisor && matchesStatus;
    });
    return sortCollections(result, sort);
  }, [normalizedQuery, thesisYear, thesisTopic, thesisAdvisor, thesisStatus, sort]);

  const bookCategories = useMemo(() => unique(books.map((item) => item.category)), []);
  const bookLocations = useMemo(() => unique(books.map((item) => item.location)), []);
  const thesisYears = useMemo(() => unique(theses.map((item) => String(item.year))), []);
  const thesisTopics = useMemo(() => unique(theses.flatMap((item) => item.keywords)), []);
  const thesisAdvisors = useMemo(
    () => unique(theses.flatMap((item) => [item.supervisor1, item.supervisor2])),
    [],
  );
  const thesisStatuses = useMemo(() => unique(theses.map((item) => item.verificationStatus)), []);

  const activeChips =
    tab === "books"
      ? [
          chip("Kategori", bookCategory, () => setBookCategory("all")),
          chip("Lokasi", bookLocation, () => setBookLocation("all")),
          chip("Status", availabilityLabel(bookAvailability), () => setBookAvailability("all"), bookAvailability),
        ]
      : [
          chip("Tahun", thesisYear, () => setThesisYear("all")),
          chip("Topik", thesisTopic, () => setThesisTopic("all")),
          chip("Pembimbing", thesisAdvisor, () => setThesisAdvisor("all")),
          chip("Status", thesisStatus, () => setThesisStatus("all")),
        ];

  const resetCurrentFilters = () => {
    triggerLoading();
    if (tab === "books") {
      setBookCategory("all");
      setBookLocation("all");
      setBookAvailability("all");
    } else {
      setThesisYear("all");
      setThesisTopic("all");
      setThesisAdvisor("all");
      setThesisStatus("all");
    }
  };

  const currentCount = tab === "books" ? filteredBooks.length : filteredTheses.length;

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
            {currentCount} hasil ditemukan
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              triggerLoading();
            }}
            placeholder="Cari judul, penulis, topik, pembimbing, atau lokasi rak"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-12 text-base shadow-inner shadow-slate-900/3 sm:h-14"
          />
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
          <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200/70 sm:w-96">
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

          <TabsContent value="books" className="m-0">
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
          </TabsContent>

          <TabsContent value="theses" className="m-0">
            <ThesisFilters
              years={thesisYears}
              topics={thesisTopics}
              advisors={thesisAdvisors}
              statuses={thesisStatuses}
              year={thesisYear}
              topic={thesisTopic}
              advisor={thesisAdvisor}
              status={thesisStatus}
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
              onStatus={(value) => {
                setThesisStatus(value);
                triggerLoading();
              }}
            />
          </TabsContent>

          <FilterChips chips={activeChips} onReset={resetCurrentFilters} />
        </div>

        <TabsContent value="books" className="mt-6">
          {isLoading ? (
            <CatalogSkeleton />
          ) : (
            <CollectionGrid items={filteredBooks} empty="Buku tidak ditemukan." />
          )}
        </TabsContent>
        <TabsContent value="theses" className="mt-6">
          {isLoading ? (
            <CatalogSkeleton />
          ) : (
            <CollectionGrid items={filteredTheses} empty="Skripsi tidak ditemukan." />
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
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <FilterSelect label="Kategori" value={category} onValueChange={onCategory} options={categories} placeholder="Semua kategori" />
      <FilterSelect label="Lokasi rak" value={location} onValueChange={onLocation} options={locations} placeholder="Semua lokasi" />
      <FilterSelect
        label="Ketersediaan"
        value={availability}
        onValueChange={onAvailability}
        placeholder="Semua status"
        options={[
          ["available", "Tersedia"],
          ["limited", "Terbatas"],
          ["empty", "Tidak tersedia"],
        ]}
      />
    </div>
  );
}

function ThesisFilters({
  years,
  topics,
  advisors,
  statuses,
  year,
  topic,
  advisor,
  status,
  onYear,
  onTopic,
  onAdvisor,
  onStatus,
}: {
  years: string[];
  topics: string[];
  advisors: string[];
  statuses: string[];
  year: string;
  topic: string;
  advisor: string;
  status: string;
  onYear: (value: string) => void;
  onTopic: (value: string) => void;
  onAdvisor: (value: string) => void;
  onStatus: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <FilterSelect label="Tahun" value={year} onValueChange={onYear} options={years} placeholder="Semua tahun" />
      <FilterSelect label="Topik" value={topic} onValueChange={onTopic} options={topics} placeholder="Semua topik" />
      <FilterSelect label="Dosen pembimbing" value={advisor} onValueChange={onAdvisor} options={advisors} placeholder="Semua pembimbing" />
      <FilterSelect label="Status" value={status} onValueChange={onStatus} options={statuses} placeholder="Semua status" />
    </div>
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
  options: string[] | Array<[string, string]>;
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
          {options.map((option) => {
            const [optionValue, optionLabel] = Array.isArray(option)
              ? option
              : [option, option];
            return (
              <SelectItem key={optionValue} value={optionValue}>
                {optionLabel}
              </SelectItem>
            );
          })}
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
  empty,
}: {
  items: Array<Book | Thesis>;
  empty: string;
}) {
  if (!items.length) {
    return (
      <EmptyState
        title={empty}
        description="Coba gunakan kata kunci lain, ubah filter, atau reset pilihan yang aktif."
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((item) => (
        <CollectionCard key={item.id} item={item} />
      ))}
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

function sortCollections<T extends Book | Thesis>(items: T[], sort: SortValue) {
  return [...items].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "oldest") return a.year - b.year;
    return b.year - a.year;
  });
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function chip(
  label: string,
  value: string,
  clear: () => void,
  rawValue = value,
) {
  return { label, value, clear, rawValue };
}
