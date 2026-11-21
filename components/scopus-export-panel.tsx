"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BookOpen, Check, CheckCircle2, ChevronDown, Download, FileSpreadsheet, FileText, Info, LibraryBig, List, Loader2, Quote, SlidersHorizontal, X } from "lucide-react";
import type { ScopusArticle, ScopusSearchResponse } from "@/lib/scopus";
import {
  assertScopusExportable, collectAllScopusArticles, createScopusExport, deduplicateScopusArticles,
  getScopusExportFields, scopusArticleNeedsMetadata, SCOPUS_CITATION_FIELDS, SCOPUS_EXPORT_FIELDS,
  SCOPUS_EXPORT_GROUPS, SCOPUS_EXPORT_LIMIT, SCOPUS_SLR_FIELDS,
  type ScopusExportFieldId, type ScopusExportFormat, type ScopusExportScope,
} from "@/lib/scopus-export";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Props = {
  data: ScopusSearchResponse;
  selected: ScopusArticle[];
  allOnPageSelected: boolean;
  onTogglePage: () => void;
  onClear: () => void;
  onBusyChange: (busy: boolean) => void;
};
type ExportStage = "collecting" | "enriching" | "generating";
const formats = [
  { id: "xlsx", name: "Excel", extension: ".xlsx", icon: FileSpreadsheet, tone: "bg-emerald-50 text-emerald-950 hover:bg-emerald-100 has-checked:bg-emerald-100 has-checked:ring-emerald-600" },
  { id: "csv", name: "CSV", extension: ".csv", icon: FileText, tone: "bg-amber-50 text-amber-950 hover:bg-amber-100 has-checked:bg-amber-100 has-checked:ring-amber-700" },
  { id: "ris", name: "RIS", extension: ".ris", icon: BookOpen, tone: "bg-violet-50 text-violet-950 hover:bg-violet-100 has-checked:bg-violet-100 has-checked:ring-violet-600" },
] as const;

const columnGroups = SCOPUS_EXPORT_GROUPS.filter((group) => group.id !== "screening");
const panelFieldIds: ScopusExportFieldId[] = SCOPUS_EXPORT_FIELDS.filter((field) => field.group !== "screening").map((field) => field.id);
const presets = [
  { label: "Referensi dasar", fields: SCOPUS_CITATION_FIELDS },
  { label: "Kebutuhan SLR", fields: SCOPUS_SLR_FIELDS.filter((id) => panelFieldIds.includes(id)) },
  { label: "Semua data", fields: panelFieldIds },
];
const columnThemes = {
  citation: {
    label: "Sitasi", icon: Quote,
    tab: "bg-violet-50 text-violet-950 hover:bg-violet-100 data-[state=active]:bg-violet-200 data-[state=active]:text-violet-950 data-[state=active]:inset-ring-violet-500",
    panel: "bg-violet-50 text-violet-950", line: "border-violet-200!", field: "hover:bg-violet-100", accent: "accent-violet-800",
  },
  publication: {
    label: "Publikasi", icon: LibraryBig,
    tab: "bg-teal-50 text-teal-950 hover:bg-teal-100 data-[state=active]:bg-teal-200 data-[state=active]:text-teal-950 data-[state=active]:inset-ring-teal-600",
    panel: "bg-teal-50 text-teal-950", line: "border-teal-200!", field: "hover:bg-teal-100", accent: "accent-teal-800",
  },
  abstract: {
    label: "Abstrak", icon: List,
    tab: "bg-amber-50 text-amber-950 hover:bg-amber-100 data-[state=active]:bg-amber-200 data-[state=active]:text-amber-950 data-[state=active]:inset-ring-amber-600",
    panel: "bg-amber-50 text-amber-950", line: "border-amber-200!", field: "hover:bg-amber-100", accent: "accent-amber-800",
  },
};
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800";
const choiceClass = "relative flex min-h-16 min-w-0 cursor-pointer flex-col items-start justify-center gap-1 rounded-lg px-2 py-2 transition-colors has-checked:ring-2 has-checked:ring-inset has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-red-800 motion-reduce:transition-none sm:px-3";

// Give React a frame to paint the loading state before serializing a large workbook.
function paintExportState() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

export function ScopusExportPanel({ data, selected, allOnPageSelected, onTogglePage, onClear, onBusyChange }: Props) {
  const [open, setOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [scope, setScope] = useState<ScopusExportScope>("page");
  const [format, setFormat] = useState<ScopusExportFormat>("xlsx");
  const [fields, setFields] = useState<ScopusExportFieldId[]>(SCOPUS_CITATION_FIELDS);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<ExportStage>("collecting");
  const [progress, setProgress] = useState({ retrieved: 0, total: 0 });
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const panelId = useId();
  const columnsId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);
  useEffect(() => {
    if (!busy) return;
    const frame = requestAnimationFrame(() => progressRef.current?.scrollIntoView({ block: "center", behavior: "auto" }));
    return () => cancelAnimationFrame(frame);
  }, [busy]);

  const count = scope === "selected" ? selected.length : scope === "page" ? data.articles.length : data.totalResults;
  const allOverLimit = data.totalResults > SCOPUS_EXPORT_LIMIT;
  const effectiveFields = getScopusExportFields({ fields }, format);
  const compatibleFields = getScopusExportFields({ fields: panelFieldIds }, format);
  const disabled = busy || data.isDemo || !data.search || count === 0 || effectiveFields.length === 0 || (scope === "all" && allOverLimit);
  const formatName = formats.find((item) => item.id === format)!.name;

  function togglePanel(next: boolean) {
    setOpen(next);
    if (next) {
      setScope(selected.length ? "selected" : "page");
      setColumnsOpen(false);
      clearFeedback();
    }
    requestAnimationFrame(() => (next ? headingRef.current : triggerRef.current)?.focus());
  }

  function clearFeedback() { setMessage(""); setError(""); setWarnings([]); }
  function toggleField(id: ScopusExportFieldId) {
    clearFeedback();
    setFields((previous) => previous.includes(id) ? previous.filter((field) => field !== id) : [...previous, id]);
  }
  function chooseFields(next: ScopusExportFieldId[]) { clearFeedback(); setFields(next); }

  async function handleExport() {
    if (disabled || controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true); onBusyChange(true); clearFeedback();
    setStage("collecting"); setProgress({ retrieved: 0, total: count });
    try {
      await paintExportState();
      controller.signal.throwIfAborted();
      assertScopusExportable(data);
      const search = data.search;
      let collected = scope === "selected" ? selected : data.articles;
      if (scope === "all") {
        collected = await collectAllScopusArticles(data, async (page, signal) => {
          const params = new URLSearchParams({
            q: search.query, queryMode: search.queryMode ?? "basic", sort: search.sort,
            searchField: search.searchField, year: search.year, language: search.language,
            docType: search.docType, openAccess: String(search.openAccessOnly),
            page: String(page), pageSize: String(data.pageSize), purpose: "export",
          });
          const response = await fetch(`/api/scopus?${params}`, { signal, cache: "no-store" });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Pengambilan artikel terhenti. Silakan coba lagi.");
          return result as ScopusSearchResponse;
        }, controller.signal, (retrieved, total) => setProgress({ retrieved, total }));
      }
      controller.signal.throwIfAborted();
      let articles = deduplicateScopusArticles(collected);
      const fieldIds = effectiveFields.map((field) => field.id);
      const toEnrich = articles.filter((article) => /^2-s2\.0-\d+$/.test(article.eid) && scopusArticleNeedsMetadata(article, fieldIds));
      const metadataWarnings: string[] = [];
      if (toEnrich.length) {
        setStage("enriching"); setProgress({ retrieved: 0, total: toEnrich.length });
        await paintExportState();
        const updates: Record<string, Partial<ScopusArticle>> = {};
        for (let offset = 0; offset < toEnrich.length; offset += 5) {
          controller.signal.throwIfAborted();
          const batch = toEnrich.slice(offset, offset + 5);
          const response = await fetch("/api/scopus/export-metadata", {
            method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
            body: JSON.stringify({ eids: batch.map((article) => article.eid) }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Gagal melengkapi metadata. Silakan ulangi ekspor.");
          Object.assign(updates, result.updates);
          metadataWarnings.push(...(result.warnings ?? []));
          setProgress({ retrieved: Math.min(offset + batch.length, toEnrich.length), total: toEnrich.length });
          if (result.unavailable) break;
        }
        articles = articles.map((article) => ({ ...article, ...updates[article.eid] }));
      }
      controller.signal.throwIfAborted();
      setStage("generating");
      await paintExportState();
      const exportedAt = new Date().toISOString();
      const uniqueWarnings = [...new Set(metadataWarnings)];
      const file = await createScopusExport(articles, {
        search, scope, totalResults: data.totalResults, retrievedCount: collected.length, exportedAt,
        settings: { fields: fieldIds, includeSearchLog: false }, metadataWarnings: uniqueWarnings,
      }, format);
      controller.signal.throwIfAborted();
      const url = URL.createObjectURL(new Blob([file.content], { type: file.mime }));
      const link = document.createElement("a");
      const name = search.query.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 50) || "pencarian";
      link.href = url; link.download = `scopus-slr-${name}-${exportedAt.replace(/[:.]/g, "-")}.${format}`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      const duplicates = collected.length - articles.length;
      setWarnings(uniqueWarnings);
      setMessage(`${articles.length.toLocaleString("id-ID")} artikel berhasil diekspor ke ${formatName}${duplicates ? `; ${duplicates} duplikat dihapus` : ""}.`);
    } catch (cause) {
      if (controller.signal.aborted) setMessage("Ekspor dibatalkan. Tidak ada file yang diunduh.");
      else setError(cause instanceof Error ? cause.message : "Ekspor gagal. Silakan coba lagi.");
    } finally {
      controllerRef.current = null; setBusy(false); onBusyChange(false);
    }
  }

  const stages = [
    { id: "collecting", label: "Mengumpulkan artikel" },
    { id: "enriching", label: "Melengkapi metadata" },
    { id: "generating", label: `Menyusun file ${formatName}` },
  ] as const;
  const stageIndex = stages.findIndex((item) => item.id === stage);

  return (
    <section aria-label="Pemilihan dan ekspor artikel" className="mb-6 overflow-hidden rounded-2xl border border-rose-200! bg-white selection:bg-rose-200 selection:text-rose-950">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 text-rose-950 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold has-disabled:cursor-not-allowed has-disabled:text-rose-900/75">
            <input type="checkbox" checked={allOnPageSelected} disabled={busy || data.isDemo} onChange={onTogglePage} className={cn("size-4 accent-red-800", focusRing)} />
            Pilih halaman ini
          </label>
          <span aria-live="polite" className="rounded-md bg-rose-50 px-2 py-1 text-xs font-medium tabular-nums text-rose-900">{selected.length.toLocaleString("id-ID")} artikel terpilih</span>
          {selected.length > 0 && (
            <button type="button" disabled={busy} onClick={onClear} className={cn("min-h-9 rounded-sm text-xs font-semibold text-red-800 underline-offset-4 hover:underline disabled:opacity-50", focusRing)}>
              Hapus pilihan
            </button>
          )}
        </div>
        {!open && (
          <Button ref={triggerRef} type="button" disabled={data.isDemo || !data.search} aria-expanded={open} aria-controls={panelId} onClick={() => togglePanel(true)} className="h-11 rounded-xl bg-red-800 px-4 font-semibold text-white hover:bg-red-900">
            <Download />Ekspor untuk SLR<ChevronDown />
          </Button>
        )}
      </div>

      <div id={panelId} hidden={!open}>
        {open && <>
          <header className="relative isolate flex items-center justify-between gap-3 overflow-hidden border-y border-rose-100! bg-linear-to-r from-rose-200 via-fuchsia-100 to-violet-200 px-4 py-4 text-rose-950 sm:px-6 sm:py-5">
            <svg aria-hidden="true" viewBox="0 0 320 124" fill="none" className="pointer-events-none absolute right-12 top-1/2 -z-10 hidden w-72 -translate-y-1/2 sm:block">
              <path d="M0 99h80l32-32h79l36-36h93M28 113h70l21-21h112l35-35h54" stroke="#a78bfa" strokeOpacity=".55" />
              <g transform="translate(114 27) rotate(-17 35 48)">
                <rect x="1" y="1" width="68" height="94" rx="9" fill="#a7f3d0" stroke="#34d399" />
                <path d="M15 25h38v37H15zM15 37h38M15 50h38M34 25v37" stroke="#047857" strokeOpacity=".65" strokeWidth="1.5" />
              </g>
              <g transform="translate(166 8) rotate(5 35 48)">
                <rect x="1" y="1" width="68" height="94" rx="9" fill="#fde68a" stroke="#fbbf24" />
                <path d="M16 25h35M16 36h35M16 47h24M16 58h31" stroke="#92400e" strokeOpacity=".55" strokeLinecap="round" strokeWidth="1.5" />
              </g>
              <g transform="translate(216 26) rotate(21 35 48)">
                <rect x="1" y="1" width="68" height="94" rx="9" fill="#ddd6fe" stroke="#a78bfa" />
                <path d="M35 40c-6-5-13-5-21-4v25c8-1 15-1 21 4 6-5 13-5 21-4V36c-8-1-15-1-21 4Zm0 0v25" stroke="#5b21b6" strokeOpacity=".7" strokeLinejoin="round" strokeWidth="1.5" />
              </g>
            </svg>
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-900 text-white">
                <Download aria-hidden="true" className="size-5" />
              </span>
              <h3 ref={headingRef} tabIndex={-1} className="scroll-mt-24 rounded-sm text-xl font-extrabold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-800 sm:text-2xl">Ekspor literatur</h3>
            </div>
            <button type="button" aria-label="Tutup opsi ekspor" disabled={busy} onClick={() => togglePanel(false)} className={cn("grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl bg-white/65 text-violet-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40", focusRing)}>
              <X aria-hidden="true" className="size-5" />
            </button>
          </header>

          {busy ? (
            <div ref={progressRef} role="status" aria-live="polite" aria-busy="true" className="scroll-mt-24 px-4 py-8 sm:px-6">
              <div className="mx-auto max-w-xl">
                <div className="flex items-center gap-3">
                  <Loader2 aria-hidden="true" className="size-5 shrink-0 animate-spin text-red-800 motion-reduce:animate-none" />
                  <h4 className="text-base font-bold text-slate-950">{stages[stageIndex].label}…</h4>
                </div>
                {stage !== "generating" && (
                  <p className="mt-2 text-sm tabular-nums text-slate-600">
                    {progress.retrieved.toLocaleString("id-ID")} dari {progress.total.toLocaleString("id-ID")} artikel
                  </p>
                )}
                <div role="progressbar" aria-label={stages[stageIndex].label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stage === "generating" ? undefined : Math.round(progress.retrieved / Math.max(1, progress.total) * 100)} className="mt-4 h-2 overflow-hidden rounded-full bg-red-100">
                  <div className={cn("h-full rounded-full bg-red-800 transition-[width] duration-200 motion-reduce:transition-none", stage === "generating" && "w-1/3 animate-pulse motion-reduce:animate-none")} style={stage === "generating" ? undefined : { width: `${progress.retrieved / Math.max(1, progress.total) * 100}%` }} />
                </div>
                <ol className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                  {stages.map((item, index) => (
                    <li key={item.id} aria-current={index === stageIndex ? "step" : undefined} className={cn("flex items-center gap-1.5", index === stageIndex ? "font-bold text-red-900" : "text-slate-600")}>
                      {index < stageIndex ? <CheckCircle2 aria-hidden="true" className="size-4 text-emerald-700" /> : <span aria-hidden="true" className={cn("size-2 rounded-full", index === stageIndex ? "bg-red-800" : "border border-slate-400")} />}
                      {item.label}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <div className="px-4 sm:px-6">
              <div className="grid gap-5 py-5 md:grid-cols-2 md:gap-8">
                <fieldset className="min-w-0">
                  <legend className="mb-2 text-sm font-bold text-slate-950">Artikel</legend>
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-rose-50 p-1">
                    {([
                      ["selected", "Terpilih", selected.length, selected.length === 0],
                      ["page", "Halaman ini", data.articles.length, false],
                      ["all", "Semua hasil", data.totalResults, allOverLimit],
                    ] as const).map(([value, label, amount, unavailable]) => (
                      <label key={value} className={cn(choiceClass, "text-rose-950 hover:bg-white has-checked:bg-rose-100 has-checked:ring-rose-600 has-disabled:cursor-not-allowed has-disabled:text-rose-900/75 has-disabled:hover:bg-transparent")}>
                        <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-extrabold tabular-nums">
                          <input
                            type="radio"
                            name={`${panelId}-scope`}
                            value={value}
                            aria-label={`${label}, ${amount.toLocaleString("id-ID")} artikel`}
                            checked={scope === value}
                            disabled={unavailable}
                            onChange={() => { setScope(value); clearFeedback(); }}
                            className="size-3.5 shrink-0 accent-red-800 focus:outline-none"
                          />
                          <span>{amount.toLocaleString("id-ID")}</span>
                        </span>
                        <span className="text-xs font-semibold leading-tight">{label}</span>
                      </label>
                    ))}
                  </div>
                  {allOverLimit && <p className="mt-2 text-xs leading-relaxed text-amber-900">Maksimal 5.000 artikel per ekspor semua hasil. Persempit pencarian dengan filter.</p>}
                </fieldset>

                <fieldset className="min-w-0">
                  <legend className="mb-2 text-sm font-bold text-slate-950">Format file</legend>
                  <div className="grid grid-cols-3 gap-1.5 py-1 sm:gap-2">
                    {formats.map((item) => (
                      <label key={item.id} className={cn(choiceClass, item.tone)}>
                        <input type="radio" name={`${panelId}-format`} aria-label={`${item.name} (${item.extension})`} checked={format === item.id} onChange={() => { setFormat(item.id); clearFeedback(); }} className="sr-only" />
                        <span className="flex w-full items-center gap-1.5 text-sm font-extrabold leading-tight">
                          <item.icon aria-hidden="true" className="size-4 shrink-0" />
                          {item.name}
                          {format === item.id && <Check aria-hidden="true" className="ml-auto hidden size-4 shrink-0 min-[375px]:block" />}
                        </span>
                        <span className="text-xs leading-tight opacity-80">{item.extension}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="border-t border-slate-200 py-4">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
                    <h4 className="text-sm font-bold text-slate-950">Kolom ekspor</h4>
                    <div role="group" aria-label="Pilihan cepat kolom ekspor" className="flex flex-wrap gap-1.5">
                      {presets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          aria-pressed={fields.length === preset.fields.length && preset.fields.every((id) => fields.includes(id))}
                          onClick={() => chooseFields(preset.fields)}
                          className={cn("min-h-9 cursor-pointer rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-red-950/85 transition-colors hover:bg-slate-100 aria-pressed:border-red-200! aria-pressed:bg-red-50 aria-pressed:text-red-950 motion-reduce:transition-none", focusRing)}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="button" aria-expanded={columnsOpen} aria-controls={columnsId} onClick={() => setColumnsOpen(!columnsOpen)} className={cn("inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-bold text-red-900 hover:bg-red-50", focusRing)}>
                    <SlidersHorizontal aria-hidden="true" className="size-4" />
                    Atur kolom
                    <span className="rounded-md bg-red-50 px-1.5 py-0.5 font-semibold tabular-nums">{effectiveFields.length}<span className="sr-only"> kolom dipilih</span></span>
                    <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform motion-reduce:transition-none", columnsOpen && "rotate-180")} />
                  </button>
                </div>

                {format === "ris" && (
                  <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-violet-900">
                    <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                    Metadata tambahan tanpa tag RIS masuk ke catatan referensi.
                  </p>
                )}

                <div id={columnsId} hidden={!columnsOpen}>
                  {columnsOpen && (
                    <Tabs defaultValue="citation" className="mt-3">
                      <TabsList aria-label="Kategori kolom ekspor" className="grid h-auto w-full grid-cols-3 gap-2 bg-transparent p-0">
                        {columnGroups.map((group) => {
                          const theme = columnThemes[group.id];
                          return (
                            <TabsTrigger key={group.id} value={group.id} className={cn("min-h-11 cursor-pointer flex-col gap-1 rounded-lg px-1.5 py-2 text-xs font-semibold transition-colors data-[state=active]:font-bold data-[state=active]:inset-ring-1 data-[state=active]:shadow-none motion-reduce:transition-none min-[375px]:flex-row sm:gap-2", theme.tab)}>
                              <theme.icon aria-hidden="true" className="size-4 shrink-0" />
                              {theme.label}
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>

                      {columnGroups.map((group) => {
                        const theme = columnThemes[group.id];
                        const groupFields = compatibleFields.filter((field) => field.group === group.id);
                        const chosen = groupFields.filter((field) => fields.includes(field.id)).length;
                        const allChosen = chosen === groupFields.length;
                        return (
                          <TabsContent key={group.id} value={group.id} className={cn("mt-2 rounded-xl p-3 sm:px-4", theme.panel)}>
                            <fieldset>
                              <legend className="sr-only">{group.label}</legend>
                              <div className={cn("flex flex-wrap items-center justify-between gap-x-3 border-b pb-1", theme.line)}>
                                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs font-bold">
                                  <input
                                    type="checkbox"
                                    checked={allChosen}
                                    ref={(element) => { if (element) element.indeterminate = chosen > 0 && !allChosen; }}
                                    onChange={() => chooseFields(allChosen ? fields.filter((id) => !groupFields.some((field) => field.id === id)) : [...new Set([...fields, ...groupFields.map((field) => field.id)])])}
                                    className={cn("size-4 shrink-0", theme.accent, focusRing)}
                                  />
                                  Pilih semua di kategori ini
                                </label>
                                <span className="text-xs tabular-nums opacity-80">{chosen} dari {groupFields.length} dipilih</span>
                              </div>
                              <div className="grid gap-x-4 pt-1 min-[360px]:grid-cols-2 lg:grid-cols-3">
                                {groupFields.map((field) => (
                                  <label key={field.id} className={cn("flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 text-sm", theme.field)}>
                                    <input type="checkbox" checked={fields.includes(field.id)} onChange={() => toggleField(field.id)} className={cn("size-4 shrink-0", theme.accent, focusRing)} />
                                    {field.label}
                                  </label>
                                ))}
                              </div>
                            </fieldset>
                          </TabsContent>
                        );
                      })}

                      <div className="mt-1 flex px-1 sm:justify-end sm:px-2">
                        <button type="button" disabled={fields.length === 0} onClick={() => chooseFields([])} className={cn("min-h-10 cursor-pointer rounded-sm text-xs font-semibold text-red-800 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-slate-500", focusRing)}>
                          Kosongkan semua kolom
                        </button>
                      </div>
                    </Tabs>
                  )}
                </div>
              </div>
            </div>
          )}

          <footer className="border-t border-rose-100! bg-linear-to-r from-rose-50 via-white to-violet-50 px-4 py-3 sm:px-6">
            {error && <p role="alert" className="mb-3 text-sm font-medium text-red-800">{error}</p>}
            {message && (
              <p role="status" className="mb-3 flex items-center gap-2 text-sm font-medium text-rose-950">
                {message.startsWith("Ekspor dibatalkan") ? <Info aria-hidden="true" className="size-4 shrink-0 text-rose-800" /> : <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-emerald-700" />}
                {message}
              </p>
            )}
            {warnings.map((warning) => <p key={warning} role="status" className="mb-3 text-xs leading-relaxed text-amber-900">{warning}</p>)}
            {!busy && effectiveFields.length === 0 && <p role="status" className="mb-2 text-xs font-semibold text-red-800">Pilih minimal satu kolom untuk mengunduh.</p>}
            <div className="flex flex-col items-start gap-x-3 gap-y-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm tabular-nums text-rose-950">
                <strong className="font-bold">{count.toLocaleString("id-ID")}</strong> artikel
                <span className="text-rose-800"> · </span>
                {effectiveFields.length} kolom
              </p>
              {busy ? (
                <Button type="button" variant="outline" className="h-11 rounded-xl border-slate-300 bg-white" onClick={() => controllerRef.current?.abort()}><X />Batalkan ekspor</Button>
              ) : (
                <Button type="button" onClick={handleExport} disabled={disabled} className="h-11 rounded-xl bg-red-800 px-4 font-semibold text-white hover:bg-red-900"><Download />Unduh {formatName}</Button>
              )}
            </div>
          </footer>
        </>}
      </div>
    </section>
  );
}
