"use client";
import Link from "next/link";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Expand,
  Grid2X2,
  Loader2,
  MessageCircle,
  Search,
  TextSelect,
  X,
  ZoomIn,
  ZoomOut,
  PanelRightClose,
  FileText,
  Layers,
} from "lucide-react";
import { FlipStage, type FlipHandle } from "./flip-stage";
import { ChatPanel } from "./chat-panel";
import type {
  ReaderManifest,
  ReaderKind,
  ReaderWord,
  SearchHit,
} from "@/lib/reader/types";
import { normalizeText, queryTerms } from "@/lib/reader/core";

type Props = {
  kind: ReaderKind;
  id: string;
  title: string;
  author: string;
  initialPage: number;
  requestedRevision?: string;
  fallbackUrl?: string;
};
export function ReaderApp({
  kind,
  id,
  title,
  author,
  initialPage,
  requestedRevision,
  fallbackUrl,
}: Props) {
  const [manifest, setManifest] = useState<ReaderManifest | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [current, setCurrent] = useState(initialPage);
  const [pageInput, setPageInput] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [vertical, setVertical] = useState(kind === "thesis");
  const [tab, setTab] = useState<"search" | "chat" | "thumbs" | "text" | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [highlight, setHighlight] = useState<{
    page: number;
    words: ReaderWord[];
  }>();
  const [text, setText] = useState("");
  const [textPage, setTextPage] = useState(0);
  const [pageQuality, setPageQuality] = useState("");
  const [chatPage, setChatPage] = useState(false);
  const [notice, setNotice] = useState("");
  const [thumbStart, setThumbStart] = useState(0);
  const flip = useRef<FlipHandle>(null);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const searchVersion = useRef(0);
  const mobile = useSyncExternalStore(subscribeMobile, getMobile, () => false);
  useEffect(() => {
    if (!tab) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current
      ?.querySelector<HTMLElement>("input,button,textarea")
      ?.focus({ preventScroll: true });
    return () => previous?.focus({ preventScroll: true });
  }, [tab]);
  const api = `/api/reader/${kind}/${encodeURIComponent(id)}`;
  useEffect(() => {
    const abort = new AbortController();
    fetch(api, { signal: abort.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (requestedRevision && d.revision !== requestedRevision)
          throw Error(
            "Dokumen telah diperbarui. Buka versi terbaru dari katalog.",
          );
        if (!d.pages.some((p: { number: number }) => p.number === initialPage))
          throw Error(
            "Halaman tujuan tidak tersedia. Pilih buku dari katalog untuk membuka halaman yang diizinkan.",
          );
        setManifest(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.message || "Buku belum dapat dibuka.");
      });
    return () => abort.abort();
  }, [api, reload, requestedRevision, initialPage]);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    getMotion,
    () => false,
  );
  const go = useCallback(
    (page: number) => {
      if (!manifest?.pages.some((p) => p.number === page)) {
        setNotice("Halaman tersebut tidak tersedia dalam dokumen ini.");
        return;
      }
      flip.current?.go(page);
      setCurrent(page);
      setPageInput(null);
      setNotice("");
      const url = new URL(window.location.href);
      url.searchParams.set("page", String(page));
      url.searchParams.set("v", manifest.revision);
      window.history.replaceState(null, "", url);
    },
    [manifest],
  );
  useEffect(() => {
    if (manifest)
      try {
        localStorage.setItem(
          `rb-reader:${manifest.key}:${manifest.revision}`,
          String(current),
        );
      } catch {}
  }, [current, manifest]);
  useEffect(() => {
    if (!manifest) return;
    const abort = new AbortController();
    fetch(`${api}/page?page=${current}&v=${manifest.revision}`, {
      signal: abort.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setNotice(d.error);
          return;
        }
        setText(d.text || "");
        setTextPage(current);
        setPageQuality(d.quality);
        const terms = queryTerms(query);
        setHighlight({
          page: current,
          words: query.trim()
            ? d.words.filter((w: ReaderWord) =>
                terms.some((t) => normalizeText(w.text).includes(t)),
              )
            : [],
        });
      })
      .catch(() => {});
    return () => abort.abort();
  }, [api, manifest, current, query]);
  useEffect(() => {
    if (!manifest || query.trim().length < 2) {
      return;
    }
    const abort = new AbortController();
    const timer = setTimeout(() => {
      fetch(
        `${api}/search?q=${encodeURIComponent(query)}&v=${manifest.revision}`,
        { signal: abort.signal },
      )
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw Error(d.error);
          setHits(d.hits);
          setNextOffset(d.nextOffset);
        })
        .catch((e) => {
          if (e.name !== "AbortError") setSearchError(e.message);
        })
        .finally(() => {
          if (!abort.signal.aborted) setSearching(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [query, api, manifest]);
  async function more() {
    if (nextOffset === null || !manifest) return;
    setSearching(true);
    const version = searchVersion.current;
    try {
      const r = await fetch(
        `${api}/search?q=${encodeURIComponent(query)}&v=${manifest.revision}&offset=${nextOffset}`,
      );
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (version !== searchVersion.current) return;
      setHits((h) => [...h, ...d.hits]);
      setNextOffset(d.nextOffset);
    } catch {
      if (version === searchVersion.current)
        setSearchError("Hasil berikutnya belum dapat dimuat.");
    } finally {
      if (version === searchVersion.current) setSearching(false);
    }
  }
  function source(url: string) {
    const u = new URL(url, window.location.origin);
    const same = `/baca/${kind === "book" ? "buku" : "skripsi"}/${encodeURIComponent(id)}`;
    if (
      u.pathname === same &&
      (!u.searchParams.get("v") ||
        u.searchParams.get("v") === manifest?.revision)
    ) {
      go(Number(u.searchParams.get("page")));
      if (window.innerWidth < 768) setTab(null);
    } else window.location.assign(u.pathname + u.search);
  }
  const index = manifest?.pages.findIndex((p) => p.number === current) ?? 0;
  const toggle = (value: typeof tab) =>
    setTab((prev) => (prev === value ? null : value));
  return (
    <div
      className="reader-shell"
      ref={root}
      onKeyDown={(e) => {
        if (
          (e.target as HTMLElement).closest(
            'input,textarea,button,[role="dialog"]',
          )
        )
          return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          flip.current?.next();
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          flip.current?.prev();
        }
      }}
      tabIndex={-1}
    >
      <header className="reader-header" inert={mobile && !!tab}>
        <Link
          href="/katalog"
          className="reader-back"
          aria-label="Kembali ke katalog"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="reader-brand-mark">
          <BookOpen size={19} />
        </div>
        <div className="reader-heading">
          <h1>{title}</h1>
          <p>{author || "Ruang Baca PMat"}</p>
        </div>
        <span className="reader-brand-name">
          Ruang Baca<span>.</span>
        </span>
        <button
          className="reader-icon-button"
          type="button"
          aria-label="Layar penuh"
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else
              void root.current
                ?.requestFullscreen()
                .catch(() =>
                  setNotice("Layar penuh tidak tersedia pada perangkat ini."),
                );
          }}
        >
          <Expand size={18} />
        </button>
      </header>
      <div className="reader-body">
        <main
          className="reader-main"
          aria-label="Halaman buku"
          inert={mobile && !!tab}
        >
          <div className="reader-stage-bar">
            <span>
              <span className="reader-live-dot" />{" "}
              {kind === "book" ? "E-Book Digital" : "Repositori Skripsi"}
            </span>
            <div>
              {fallbackUrl && (
                <a
                  href={fallbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reader-source-link"
                >
                  PDF sumber
                </a>
              )}
              <button
                className={vertical ? "is-selected" : ""}
                type="button"
                onClick={() => setVertical((v) => !v)}
                aria-pressed={vertical || reducedMotion || zoom > 1}
                disabled={reducedMotion || zoom > 1}
              >
                <Layers size={14} />
                <span>
                  {vertical || reducedMotion || zoom > 1
                    ? "Mode halaman"
                    : "Mode flipbook"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
                aria-label="Perkecil"
                disabled={zoom <= 1}
              >
                <ZoomOut size={15} />
              </button>
              <span className="reader-zoom-label">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
                aria-label="Perbesar"
                disabled={zoom >= 2}
              >
                <ZoomIn size={15} />
              </button>
            </div>
          </div>
          {error ? (
            <div className="reader-state">
              <BookOpen size={40} />
              <h2>Buku sedang disiapkan</h2>
              <p>{error}</p>
              <div>
                <button
                  type="button"
                  className="reader-primary"
                  onClick={() => {
                    setError("");
                    setManifest(null);
                    setReload((n) => n + 1);
                  }}
                >
                  Coba lagi
                </button>
                <Link
                  href={`/katalog/${kind === "book" ? "buku" : "skripsi"}/${encodeURIComponent(id)}`}
                >
                  Lihat detail koleksi <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : !manifest ? (
            <div className="reader-state" role="status">
              <Loader2 className="reader-spinner" size={30} />
              <h2>Membuka halaman buku…</h2>
              <p>Menyiapkan halaman yang ingin Anda baca.</p>
            </div>
          ) : (
            <FlipStage
              ref={flip}
              manifest={manifest}
              initialPage={initialPage}
              zoom={zoom}
              vertical={vertical || reducedMotion || zoom > 1}
              highlight={highlight}
              onPage={(number) => {
                setCurrent(number);
                setPageInput(null);
                const url = new URL(window.location.href);
                url.searchParams.set("page", String(number));
                url.searchParams.set("v", manifest.revision);
                window.history.replaceState(null, "", url);
              }}
            />
          )}
          {notice && (
            <div className="reader-notice" role="status">
              {notice}
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Tutup pemberitahuan"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <footer className="reader-bottom">
            <div className="reader-page-navigation">
              <button
                type="button"
                aria-label="Halaman sebelumnya"
                onClick={() => flip.current?.prev()}
                disabled={!manifest || index <= 0}
              >
                <ChevronLeft size={18} />
              </button>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  go(Number(pageInput ?? current));
                }}
              >
                <label htmlFor="reader-page">Halaman PDF</label>
                <input
                  id="reader-page"
                  inputMode="numeric"
                  value={pageInput ?? String(current)}
                  onChange={(e) => setPageInput(e.target.value)}
                  aria-label="Nomor halaman PDF"
                  disabled={!manifest}
                />
                <span>/ {manifest?.totalPages || "—"}</span>
              </form>
              <button
                type="button"
                aria-label="Halaman berikutnya"
                onClick={() => flip.current?.next()}
                disabled={!manifest || index >= manifest.pages.length - 1}
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="reader-tools">
              <button
                className={tab === "thumbs" ? "is-active" : ""}
                aria-label="Daftar halaman"
                aria-expanded={tab === "thumbs"}
                type="button"
                onClick={() => toggle("thumbs")}
                disabled={!manifest}
              >
                <Grid2X2 size={17} />
                <span>Halaman</span>
              </button>
              <button
                className={tab === "search" ? "is-active" : ""}
                aria-expanded={tab === "search"}
                type="button"
                onClick={() => toggle("search")}
                disabled={!manifest}
              >
                <Search size={17} />
                <span>Cari isi</span>
              </button>
              <button
                className={tab === "text" ? "is-active" : ""}
                aria-expanded={tab === "text"}
                type="button"
                onClick={() => toggle("text")}
                disabled={!manifest}
                aria-label="Baca teks halaman"
              >
                <TextSelect size={17} />
              </button>
              <button
                className={`reader-ask-button ${tab === "chat" ? "is-active" : ""}`}
                aria-expanded={tab === "chat"}
                type="button"
                onClick={() => toggle("chat")}
                disabled={!manifest}
              >
                <MessageCircle size={17} />
                <span>Tanya buku</span>
              </button>
            </div>
          </footer>
        </main>
        {tab && manifest && (
          <aside
            className="reader-panel"
            ref={panel}
            role={mobile ? "dialog" : undefined}
            aria-modal={mobile || undefined}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setTab(null);
              }
              if (!mobile || e.key !== "Tab") return;
              const elements = Array.from(
                panel.current?.querySelectorAll<HTMLElement>(
                  "button:not(:disabled),input:not(:disabled),textarea:not(:disabled),a[href],summary",
                ) || [],
              ).filter((el) => el.getClientRects().length);
              const first = elements[0];
              const last = elements[elements.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus({ preventScroll: true });
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus({ preventScroll: true });
              }
            }}
            aria-label={
              tab === "chat"
                ? "Tanya buku"
                : tab === "search"
                  ? "Pencarian isi"
                  : "Navigasi dokumen"
            }
          >
            <div className="reader-panel-header">
              <span>
                {tab === "chat"
                  ? "Asisten buku"
                  : tab === "search"
                    ? "Pencarian isi"
                    : tab === "text"
                      ? "Teks halaman"
                      : "Jelajahi halaman"}
              </span>
              <button
                className="reader-icon-button"
                type="button"
                onClick={() => setTab(null)}
                aria-label="Tutup panel"
              >
                <PanelRightClose size={18} />
              </button>
            </div>
            {tab === "chat" ? (
              <>
                <div className="reader-scope">
                  <button
                    type="button"
                    className={!chatPage ? "is-active" : ""}
                    onClick={() => setChatPage(false)}
                  >
                    Buku ini
                  </button>
                  <button
                    type="button"
                    className={chatPage ? "is-active" : ""}
                    onClick={() => setChatPage(true)}
                  >
                    Halaman {current}
                  </button>
                </div>
                <ChatPanel
                  key={`${manifest.key}:${chatPage ? current : "book"}`}
                  title={chatPage ? "Tanya halaman ini" : "Tanya buku ini"}
                  scope={{
                    kind,
                    id,
                    revision: manifest.revision,
                    ...(chatPage ? { page: current } : {}),
                  }}
                  onSource={source}
                />
              </>
            ) : tab === "search" ? (
              <div className="reader-search-panel">
                <label className="reader-search-field">
                  <Search size={17} />
                  <input
                    placeholder="Cari kata atau frasa…"
                    value={query}
                    onChange={(e) => {
                      searchVersion.current += 1;
                      setQuery(e.target.value);
                      setHits([]);
                      setNextOffset(null);
                      setSearchError("");
                      setSearching(e.target.value.trim().length >= 2);
                    }}
                    maxLength={200}
                    aria-label="Cari isi dokumen"
                  />
                </label>
                <p className="reader-panel-caption">
                  Cari bagian buku yang teksnya sudah tersedia.
                </p>
                {searching && (
                  <p className="reader-panel-caption" role="status">
                    Mencari…
                  </p>
                )}
                {searchError && (
                  <p role="alert" className="reader-error-text">
                    {searchError}
                  </p>
                )}
                {!searching &&
                  query.length >= 2 &&
                  !hits.length &&
                  !searchError && (
                    <div className="reader-empty">
                      <Search size={26} />
                      <p>Kata belum ditemukan.</p>
                      <span>
                        Coba istilah lain atau kata yang lebih singkat.
                      </span>
                    </div>
                  )}
                {!searching && query.trim().length >= 2 && hits.length > 0 && (
                  <p className="reader-search-count" role="status">
                    {nextOffset !== null
                      ? `Sedikitnya ${hits.length} halaman ditemukan · masih ada hasil lain`
                      : `${hits.length} halaman ditemukan · semua hasil ditampilkan`}
                  </p>
                )}
                {hits.map((hit) => (
                  <button
                    key={hit.page}
                    type="button"
                    className="reader-search-hit"
                    onClick={() => {
                      go(hit.page);
                      if (window.innerWidth < 768) setTab(null);
                    }}
                  >
                    <span>
                      Halaman {hit.label} <small>PDF {hit.page}</small>
                      <ArrowRight size={14} />
                    </span>
                    {hit.quality === "poor" && (
                      <small className="reader-extraction-warning">
                        Teks kurang jelas · periksa halaman asli
                      </small>
                    )}
                    <p>{hit.excerpt}</p>
                  </button>
                ))}
                {nextOffset !== null && (
                  <button
                    type="button"
                    className="reader-load-more"
                    onClick={more}
                    disabled={searching}
                  >
                    Hasil berikutnya
                  </button>
                )}
              </div>
            ) : tab === "text" ? (
              <div className="reader-text-panel">
                <div className="reader-panel-symbol">
                  <FileText size={18} />
                </div>
                <h2>Halaman PDF {current}</h2>
                <p className="reader-panel-caption">
                  Teks sumber untuk membaca dan menyalin bagian yang diperlukan.
                </p>
                {textPage === current && pageQuality === "poor" && (
                  <p className="reader-extraction-warning">
                    Sebagian teks kurang jelas. Periksa halaman asli untuk
                    memastikan bacaannya.
                  </p>
                )}
                {textPage === current && pageQuality === "image" ? (
                  <p>
                    Halaman berupa gambar dan belum memiliki teks yang dapat
                    dicari.
                  </p>
                ) : (
                  <p className="reader-plain-text">
                    {textPage === current
                      ? text || "Halaman tidak memiliki teks yang terbaca."
                      : "Memuat teks halaman…"}
                  </p>
                )}
              </div>
            ) : (
              <div className="reader-thumbnail-panel">
                {manifest.outline.length > 0 && (
                  <details>
                    <summary>Daftar isi</summary>
                    {manifest.outline.map((o, i) => (
                      <button key={i} type="button" onClick={() => go(o.page)}>
                        {o.title}
                        <span>{o.page}</span>
                      </button>
                    ))}
                  </details>
                )}
                <div className="reader-thumbnails">
                  {manifest.pages
                    .slice(thumbStart, thumbStart + 24)
                    .map((p) => (
                      <button
                        key={p.number}
                        className={current === p.number ? "is-active" : ""}
                        type="button"
                        onClick={() => {
                          go(p.number);
                          if (window.innerWidth < 768) setTab(null);
                        }}
                      >
                        <Image
                          unoptimized
                          width={180}
                          height={250}
                          src={p.thumbnail}
                          alt={`Halaman ${p.label}`}
                          loading="lazy"
                        />
                        <span>{p.label}</span>
                      </button>
                    ))}
                </div>
                <div className="reader-thumb-paging">
                  <button
                    type="button"
                    disabled={thumbStart <= 0}
                    onClick={() => setThumbStart((s) => Math.max(0, s - 24))}
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={thumbStart + 24 >= manifest.pages.length}
                    onClick={() => setThumbStart((s) => s + 24)}
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

function getMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function subscribeMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function subscribeMobile(cb: () => void) {
  const mq = window.matchMedia("(max-width: 767px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function getMobile() {
  return window.matchMedia("(max-width: 767px)").matches;
}
