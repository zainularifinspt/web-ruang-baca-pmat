"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  LogIn,
  ScanLine,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavSearchItem = {
  id: string;
  type: "book" | "thesis";
  title: string;
  category: string;
  coverUrl: string | null;
  href: string;
  searchText: string;
};

export function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [searchItems, setSearchItems] = useState<NavSearchItem[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadSearchItems() {
      try {
        const response = await fetch("/api/catalog/search");
        const payload = (await response.json()) as { items?: NavSearchItem[] };
        if (!ignore) setSearchItems(payload.items ?? []);
      } catch {
        if (!ignore) setSearchItems([]);
      }
    }

    void loadSearchItems();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-300",
        scrolled
          ? "border-slate-200 bg-white/95 shadow-sm backdrop-blur"
          : "border-transparent bg-white/90 backdrop-blur",
      )}
    >
      <div className="mx-auto flex min-h-18 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-primary-foreground shadow-sm transition group-hover:scale-105 sm:size-11">
            <BookOpen className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold leading-none text-slate-950">Ruang Baca PMat</p>
            <p className="mt-1 truncate text-xs text-slate-500">Jurusan Pendidikan Matematika ULM</p>
          </div>
        </Link>
        <NavbarSearch items={searchItems} className="order-3 w-full md:order-none md:w-[min(42vw,28rem)]" />
        <nav className="hidden items-center gap-3 md:flex">
          <NavLink href="/katalog?tab=books" icon={Search} label="Katalog" />
          <NavLink href="/presensi" icon={ScanLine} label="Presensi" />
          <div className="mx-1 h-6 w-px bg-slate-200" />
          <Button asChild size="sm" className="rounded-full">
            <Link href="/login?redirectTo=/dashboard">
              <LogIn />
              Admin
            </Link>
          </Button>
        </nav>
        <div className="flex items-center gap-1.5 md:hidden">
          <MobileIconLink href="/katalog?tab=books" label="Katalog" icon={Search} />
          <MobileIconLink href="/presensi" label="Presensi" icon={ScanLine} />
          <MobileIconLink href="/login?redirectTo=/dashboard" label="Admin" icon={LogIn} />
        </div>
      </div>
    </header>
  );
}

function NavbarSearch({
  items,
  className,
}: {
  items: NavSearchItem[];
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 220);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useMemo(() => {
    const keyword = debouncedQuery.toLowerCase();
    if (!keyword) return [];

    return items
      .filter((item) =>
        [item.title, item.category, item.searchText]
          .join(" ")
          .toLowerCase()
          .includes(keyword),
      )
      .slice(0, 6);
  }, [debouncedQuery, items]);

  const isOpen = focused && query.trim().length > 0;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 140)}
          placeholder="Cari buku atau skripsi"
          className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm shadow-inner shadow-slate-950/4 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-600/15"
        />
        {query ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
            }}
            className="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Kosongkan pencarian"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="nav-search-dropdown absolute left-0 right-0 top-full mt-2 origin-top overflow-hidden rounded-[1.25rem] bg-white shadow-2xl shadow-slate-950/15 ring-1 ring-slate-200/80 backdrop-blur">
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
            {results.length ? `${results.length} hasil cepat` : "Tidak ada hasil"}
          </div>
          <div className="grid max-h-80 overflow-auto p-2">
            {results.length ? (
              results.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  onClick={() => {
                    setQuery("");
                    setDebouncedQuery("");
                  }}
                  className="group flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-emerald-50"
                >
                  <SearchCover item={item} />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-semibold text-slate-950">
                      {item.title}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span>{item.type === "book" ? "Buku" : "Skripsi"}</span>
                      <span className="size-1 rounded-full bg-slate-300" />
                      <span className="line-clamp-1">{item.category}</span>
                    </span>
                  </span>
                </Link>
              ))
            ) : (
              <div className="px-3 py-7 text-center text-sm text-slate-500">
                Coba kata kunci judul, penulis, kategori, atau topik lain.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SearchCover({ item }: { item: NavSearchItem }) {
  const Icon = item.type === "book" ? BookOpen : GraduationCap;

  return (
    <span className="relative flex size-12 shrink-0 overflow-hidden rounded-2xl bg-emerald-900 text-white shadow-sm">
      {item.coverUrl ? (
        <span
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${item.coverUrl})` }}
        />
      ) : (
        <span className="absolute inset-0 bg-[linear-gradient(145deg,#0f766e,#0f172a)]" />
      )}
      <span className="absolute inset-0 bg-slate-950/20" />
      <span className="relative flex size-full items-center justify-center">
        <Icon className="size-5" />
      </span>
    </span>
  );
}

function MobileIconLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Button asChild variant="outline" size="icon" className="size-10 rounded-full bg-white">
      <Link href={href}>
        <Icon />
        <span className="sr-only">{label}</span>
      </Link>
    </Button>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group relative inline-flex items-center gap-2 rounded-full px-2.5 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
    >
      <Icon className="size-4 text-emerald-600 transition group-hover:-translate-y-0.5" />
      {label}
      <span className="absolute inset-x-3 -bottom-0.5 h-0.5 scale-x-0 rounded-full bg-emerald-600 transition-transform duration-300 group-hover:scale-x-100" />
    </Link>
  );
}
