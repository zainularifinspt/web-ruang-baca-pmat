"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Globe2,
  GraduationCap,
  Info,
  LogIn,
  Menu,
  ScanLine,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CatalogSearchItem } from "@/lib/catalog-search";
import { cn } from "@/lib/utils";

export function PublicNav({
  initialSearchItems = [],
}: {
  initialSearchItems?: CatalogSearchItem[];
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchItems, setSearchItems] = useState<CatalogSearchItem[]>(initialSearchItems);

  const isHomeHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (initialSearchItems.length) return;

    let ignore = false;

    async function loadSearchItems() {
      try {
        const response = await fetch("/api/catalog/search");
        const payload = (await response.json()) as { items?: CatalogSearchItem[] };
        if (!ignore) setSearchItems(payload.items ?? []);
      } catch {
        if (!ignore) setSearchItems([]);
      }
    }

    const schedule = window.requestIdleCallback ?? ((callback: IdleRequestCallback) => window.setTimeout(callback, 900));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const timer = schedule(() => {
      void loadSearchItems();
    });

    return () => {
      ignore = true;
      cancel(timer);
    };
  }, [initialSearchItems.length]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-300",
        isHomeHero
          ? "border-white/10 bg-transparent text-white"
          : scrolled
            ? "border-slate-200/80 bg-white/95 shadow-xs backdrop-blur-md text-slate-900"
            : "border-slate-200/50 bg-white/90 backdrop-blur-sm text-slate-900",
      )}
    >
      <div className="mx-auto flex min-h-16 sm:min-h-18 max-w-7xl items-center justify-between gap-3 px-3.5 py-2.5 sm:px-6 sm:py-3.5">
        <Link href="/" className="group flex min-w-0 max-w-[calc(100%-54px)] items-center gap-3">
          <div className="flex shrink-0 items-center -space-x-1 sm:-space-x-1.5">
            <div className={cn(
              "flex size-9 sm:size-10 items-center justify-center rounded-xl text-white shadow-xs transition-transform duration-200 group-hover:scale-105",
              isHomeHero ? "bg-white/20 border border-white/30 backdrop-blur-sm" : "bg-red-800"
            )}>
              <BookOpen className="size-4.5 sm:size-5" />
            </div>
            <span className="flex size-8 sm:size-9 items-center justify-center rounded-full border border-white bg-white shadow-xs ring-1 ring-slate-200">
              <Image src="/ulm-logo.png" alt="Logo Universitas Lambung Mangkurat" width={28} height={28} className="size-5 sm:size-6 object-contain" priority />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-sm sm:text-base font-bold leading-tight tracking-tight", isHomeHero ? "text-white" : "text-slate-900")}>Ruang Baca PMat</p>
            <p className={cn("mt-0.5 truncate text-[11px] sm:text-xs font-medium", isHomeHero ? "text-red-200/85" : "text-slate-500")}>Pendidikan Matematika FKIP ULM</p>
          </div>
        </Link>
        <NavbarSearch items={searchItems} className={cn(isHomeHero ? "hidden" : "hidden md:block", "order-3 w-full md:order-none md:w-[min(42vw,28rem)]")} />
        <nav className="hidden items-center gap-1.5 md:flex">
          <NavLink href="/katalog" icon={Search} label="Katalog" isHomeHero={isHomeHero} />
          <NavLink href="/scopus" icon={Globe2} label="Scopus" isHomeHero={isHomeHero} />
          <NavLink href="/presensi" icon={ScanLine} label="Presensi" isHomeHero={isHomeHero} />
          <NavLink href="/tentang" icon={Info} label="Tentang" isHomeHero={isHomeHero} />
          <div className={cn("mx-1 h-5 w-px", isHomeHero ? "bg-white/20" : "bg-slate-200")} />
          <Button asChild size="sm" className={cn(
            "rounded-full px-4.5 py-2 text-xs font-bold transition-all duration-200 border-0 cursor-pointer",
            isHomeHero
              ? "bg-white text-slate-950 hover:bg-white/90 shadow-md hover:scale-105 active:scale-95"
              : "bg-red-800 text-white hover:bg-red-900 active:scale-[0.99]"
          )}>
            <Link href="/login?redirectTo=/dashboard" className="flex items-center gap-1.5">
              <span>Admin</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </nav>
        <MobileNav isHomeHero={isHomeHero} />
      </div>
    </header>
  );
}

function NavbarSearch({
  items,
  className,
}: {
  items: CatalogSearchItem[];
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
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 140)}
          placeholder="Cari buku atau skripsi..."
          className="h-9.5 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-9 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-100"
        />
        {query ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
            }}
            className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Kosongkan pencarian"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="nav-search-dropdown absolute left-0 right-0 top-full mt-2 origin-top overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-slate-950/5"
            style={{ willChange: "transform, opacity" }}
          >
            <div className="border-b border-slate-100 px-4 py-2 text-xs font-semibold text-slate-500">
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
                    className="group flex items-center gap-3 rounded-2xl p-2.5 transition-colors duration-200 hover:bg-yellow-50"
                  >
                    <SearchCover item={item} />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm font-bold text-slate-900 transition-colors duration-200 group-hover:text-yellow-800">
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
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SearchCover({ item }: { item: CatalogSearchItem }) {
  const Icon = item.type === "book" ? BookOpen : GraduationCap;

  return (
    <span className="relative flex size-12 shrink-0 overflow-hidden rounded-2xl bg-red-900 text-white shadow-sm ring-1 ring-white/60">
      {item.coverUrl ? (
        <Image
          src={item.coverUrl}
          alt=""
          fill
          className="object-cover"
          sizes="48px"
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
  isHomeHero = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isHomeHero?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200",
        isHomeHero
          ? "text-white/85 hover:text-white hover:bg-white/15"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      <Icon className={cn(
        "size-3.5 transition-colors",
        isHomeHero ? "text-white/70 group-hover:text-white" : "text-slate-400 group-hover:text-slate-900",
      )} />
      {label}
    </Link>
  );
}

function MobileNav({ isHomeHero = false }: { isHomeHero?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "size-10 rounded-full shadow-sm transition-colors",
          isHomeHero
            ? "border-white/30 bg-white/15 text-white hover:bg-white/25"
            : "border-white/80 bg-white/85 text-slate-700 hover:bg-slate-100",
        )}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="absolute left-0 right-0 top-full border-b border-slate-200/60 bg-white/95 p-4 shadow-xl backdrop-blur-2xl"
            style={{ willChange: "transform, opacity" }}
          >
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
                href="/scopus"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <Globe2 className="size-4" />
                </div>
                Pencarian Scopus
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
                href="/tentang"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Info className="size-4" />
                </div>
                Tentang
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
