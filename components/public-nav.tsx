"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  LogIn,
  Menu,
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
        "sticky top-0 z-40 border-b transition-all duration-500",
        scrolled
          ? "border-white/30 bg-white/65 shadow-[0_8px_30px_rgba(15,23,42,0.03)] backdrop-blur-3xl"
          : "border-transparent bg-white/40 backdrop-blur-3xl",
      )}
    >
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="group flex min-w-0 max-w-[calc(100%-60px)] items-center gap-3">
          <div className="flex shrink-0 items-center -space-x-2">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#047857,#0891b2_55%,#7c3aed)] text-primary-foreground shadow-lg shadow-red-950/15 transition-all duration-300 group-hover:scale-105 sm:size-11">
              <BookOpen className="size-5" />
            </div>
            <span className="flex size-9 items-center justify-center rounded-full border border-white bg-white shadow-sm ring-1 ring-slate-100 sm:size-10">
              <Image src="/ulm-logo.png" alt="Logo Universitas Lambung Mangkurat" width={30} height={30} className="size-7 object-contain sm:size-8" priority />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold leading-none tracking-tight text-slate-950">Ruang Baca PMat</p>
            <p className="mt-1 truncate text-xs text-slate-500">Jurusan Pendidikan Matematika ULM</p>
          </div>
        </Link>
        <NavbarSearch items={searchItems} className="hidden md:block order-3 w-full md:order-none md:w-[min(42vw,28rem)]" />
        <nav className="hidden items-center gap-3 md:flex">
          <NavLink href="/katalog" icon={Search} label="Katalog" />
          <NavLink href="/presensi" icon={ScanLine} label="Presensi" />
          <div className="mx-1 h-6 w-px bg-slate-200/50" />
          <Button asChild size="sm" className="rounded-full bg-gradient-to-r from-red-600 via-yellow-600 to-orange-600 px-5 text-white shadow-lg shadow-red-950/10 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-red-950/20 active:scale-[0.98] border-0">
            <Link href="/login?redirectTo=/dashboard">
              <LogIn className="size-4" />
              Admin
            </Link>
          </Button>
        </nav>
        <MobileNav />
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
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-yellow-600/70" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 140)}
          placeholder="Cari buku atau skripsi..."
          className="h-11 w-full rounded-full border border-white/40 bg-white/45 pl-10 pr-10 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-950/[0.02] outline-none backdrop-blur-xl transition-all duration-300 placeholder:font-medium placeholder:text-slate-400 focus:border-yellow-300/80 focus:bg-white/85 focus:shadow-md focus:ring-4 focus:ring-yellow-500/5"
        />
        {query ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
            }}
            className="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Kosongkan pencarian"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="nav-search-dropdown absolute left-0 right-0 top-full mt-2.5 origin-top overflow-hidden rounded-[1.75rem] border border-white/40 bg-white/75 shadow-[0_24px_50px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/20 backdrop-blur-3xl">
          <div className="border-b border-slate-100/50 px-4 py-2.5 text-xs font-semibold text-slate-500">
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
                  className="group flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-300 hover:bg-gradient-to-r hover:from-yellow-500/5 hover:to-orange-500/5"
                >
                  <SearchCover item={item} />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-bold text-slate-900 group-hover:text-yellow-800 transition-colors duration-300">
                      {item.title}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-400">{item.type === "book" ? "Buku" : "Skripsi"}</span>
                      <span className="size-1 rounded-full bg-slate-200" />
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
    <span className="relative flex size-12 shrink-0 overflow-hidden rounded-2xl bg-red-900 text-white shadow-sm ring-1 ring-white/60">
      {item.coverUrl ? (
        <span
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${item.coverUrl})` }}
        />
      ) : (
        <span className="absolute inset-0 bg-[linear-gradient(145deg,#047857,#0284c7_55%,#7c3aed)]" />
      )}
      <span className="absolute inset-0 bg-slate-950/20" />
      <span className="relative flex size-full items-center justify-center">
        <Icon className="size-5" />
      </span>
    </span>
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
      className="group relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition-all duration-300 hover:bg-white/40 hover:text-slate-950"
    >
      <Icon className="size-4 text-red-600 transition duration-300 group-hover:-translate-y-0.5" />
      {label}
      <span className="absolute inset-x-4 -bottom-px h-0.5 scale-x-0 rounded-full bg-[linear-gradient(90deg,#047857,#0891b2,#7c3aed)] transition-transform duration-300 group-hover:scale-x-100" />
    </Link>
  );
}

function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="size-10 rounded-full border-white/80 bg-white/75 shadow-sm backdrop-blur-xl transition hover:bg-slate-100"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="size-5 text-slate-700" /> : <Menu className="size-5 text-slate-700" />}
      </Button>
      {isOpen && (
        <div className="absolute left-0 right-0 top-full border-b border-slate-200/60 bg-white/95 p-4 shadow-xl backdrop-blur-2xl animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-1.5">
            <Link
              href="/katalog"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Search className="size-4" />
              </div>
              Katalog & Pencarian
            </Link>
            <Link
              href="/presensi"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <ScanLine className="size-4" />
              </div>
              Presensi Pengunjung
            </Link>
            <Link
              href="/login?redirectTo=/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <LogIn className="size-4" />
              </div>
              Login Admin
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
