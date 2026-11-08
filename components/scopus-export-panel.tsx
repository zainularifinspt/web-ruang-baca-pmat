"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BookOpen, Check, CheckCircle2, ChevronDown, Download, FileSpreadsheet, FileText, Info, Loader2, SlidersHorizontal, X } from "lucide-react";
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
  { id: "xlsx", name: "Excel", extension: ".xlsx", icon: FileSpreadsheet },
  { id: "csv", name: "CSV", extension: ".csv", icon: FileText },
  { id: "ris", name: "RIS", extension: ".ris", icon: BookOpen },
] as const;

const presets = [
  { label: "Referensi dasar", fields: SCOPUS_CITATION_FIELDS },
  { label: "Kebutuhan SLR", fields: SCOPUS_SLR_FIELDS },
  { label: "Semua data", fields: SCOPUS_EXPORT_FIELDS.map((field) => field.id) },
];
const groupLabels = { citation: "Sitasi", publication: "Publikasi", abstract: "Abstrak", screening: "Screening" };
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800";
const choiceClass = "relative flex min-h-16 min-w-0 cursor-pointer flex-col items-start justify-center gap-1 rounded-lg px-2 py-2 text-slate-700 transition-colors hover:bg-white/70 has-checked:bg-white has-checked:text-red-950 has-checked:ring-1 has-checked:ring-red-200 has-checked:ring-inset has-disabled:cursor-not-allowed has-disabled:text-slate-500 has-disabled:hover:bg-transparent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-red-800 motion-reduce:transition-none sm:px-3";

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
  const compatibleFields = getScopusExportFields({}, format);
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
    <section aria-label="Pemilihan dan ekspor artikel" className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white selection:bg-red-100 selection:text-red-950">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 text-slate-800 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold has-disabled:cursor-not-allowed has-disabled:text-slate-500">
            <input type="checkbox" checked={allOnPageSelected} disabled={busy || data.isDemo} onChange={onTogglePage} className={cn("size-4 accent-red-800", focusRing)} />
            Pilih halaman ini
          </label>
          <span aria-live="polite" className="text-xs tabular-nums text-slate-600">{selected.length.toLocaleString("id-ID")} artikel terpilih</span>
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
          <header className="relative isolate flex items-center justify-between gap-3 overflow-hidden bg-red-950 px-4 py-3.5 text-white sm:px-6">
            <svg aria-hidden="true" viewBox="0 0 280 100" fill="none" className="pointer-events-none absolute -right-4 top-1/2 -z-10 hidden w-72 -translate-y-1/2 text-rose-200/25 sm:block">
              <path d="M25 100 86 39h66l39-39M73 100l41-41h65l59-59M120 100l20-20h65l75-75" stroke="currentColor" />
              <path d="M152 39h44l39-39M179 59h47l54-54" stroke="currentColor" strokeOpacity=".55" />
              <circle cx="152" cy="39" r="2.5" fill="currentColor" />
              <circle cx="179" cy="59" r="2.5" fill="currentColor" />
            </svg>
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-rose-100">
                <Download aria-hidden="true" className="size-5" />
              </span>
              <h3 ref={headingRef} tabIndex={-1} className="scroll-mt-24 rounded-sm text-lg font-extrabold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-200 sm:text-xl">Ekspor literatur</h3>
            </div>
            <button type="button" aria-label="Tutup opsi ekspor" disabled={busy} onClick={() => togglePanel(false)} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-rose-100 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200 disabled:cursor-not-allowed disabled:opacity-40">
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
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                    {([
                      ["selected", "Terpilih", selected.length, selected.length === 0],
                      ["page", "Halaman ini", data.articles.length, false],
                      ["all", "Semua hasil", data.totalResults, allOverLimit],
                    ] as const).map(([value, label, amount, unavailable]) => (
                      <label key={value} className={choiceClass}>
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
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                    {formats.map((item) => (
                      <label key={item.id} className={choiceClass}>
                        <input type="radio" name={`${panelId}-format`} aria-label={`${item.name} (${item.extension})`} checked={format === item.id} onChange={() => { setFormat(item.id); clearFeedback(); }} className="sr-only" />
                        <span className="flex w-full items-center gap-1.5 text-sm font-extrabold leading-tight">
                          <item.icon aria-hidden="true" className="size-4 shrink-0" />
                          {item.name}
                          {format === item.id && <Check aria-hidden="true" className="ml-auto hidden size-4 shrink-0 text-red-800 min-[375px]:block" />}
                        </span>
                        <span className="text-xs leading-tight text-slate-600">{item.extension}</span>
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
                  <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                    <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                    Kolom screening hanya untuk Excel dan CSV. Metadata tambahan tanpa tag RIS masuk ke catatan referensi.
                  </p>
                )}

                <div id={columnsId} hidden={!columnsOpen}>
                  {columnsOpen && (
                    <Tabs defaultValue="citation" className="mt-3 rounded-xl bg-slate-50 p-2 sm:p-3">
                      <TabsList aria-label="Kategori kolom ekspor" className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 sm:grid-cols-4">
                        {SCOPUS_EXPORT_GROUPS.map((group) => (
                          <TabsTrigger key={group.id} value={group.id} className="min-h-10 cursor-pointer rounded-md px-2 text-xs font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-red-950 data-[state=active]:shadow-none motion-reduce:transition-none">
                            {groupLabels[group.id]}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {SCOPUS_EXPORT_GROUPS.map((group) => {
                        const groupFields = compatibleFields.filter((field) => field.group === group.id);
                        const chosen = groupFields.filter((field) => fields.includes(field.id)).length;
                        const allChosen = groupFields.length > 0 && chosen === groupFields.length;
                        return (
                          <TabsContent key={group.id} value={group.id} className="mt-3 rounded-lg px-1 sm:px-2">
                            {groupFields.length ? (
                              <fieldset>
                                <legend className="sr-only">{group.label}</legend>
                                <div className="flex flex-wrap items-center justify-between gap-x-3 border-b border-slate-200 pb-1">
                                  <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs font-bold text-slate-800">
                                    <input
                                      type="checkbox"
                                      checked={allChosen}
                                      ref={(element) => { if (element) element.indeterminate = chosen > 0 && !allChosen; }}
                                      onChange={() => chooseFields(allChosen ? fields.filter((id) => !groupFields.some((field) => field.id === id)) : [...new Set([...fields, ...groupFields.map((field) => field.id)])])}
                                      className={cn("size-4 shrink-0 accent-red-800", focusRing)}
                                    />
                                    Pilih semua di kategori ini
                                  </label>
                                  <span className="text-xs tabular-nums text-slate-600">{chosen} dari {groupFields.length} dipilih</span>
                                </div>
                                <div className="grid gap-x-4 pt-1 min-[360px]:grid-cols-2 lg:grid-cols-3">
                                  {groupFields.map((field) => (
                                    <label key={field.id} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 text-sm text-slate-800 hover:bg-slate-100">
                                      <input type="checkbox" checked={fields.includes(field.id)} onChange={() => toggleField(field.id)} className={cn("size-4 shrink-0 accent-red-800", focusRing)} />
                                      {field.label}
                                    </label>
                                  ))}
                                </div>
                              </fieldset>
                            ) : (
                              <p className="py-3 text-sm text-slate-600">Pilih Excel atau CSV untuk menyertakan kolom screening.</p>
                            )}
                          </TabsContent>
                        );
                      })}

                      <div className="mt-2 flex justify-end border-t border-slate-200 px-1 pt-1 sm:px-2">
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

          <footer className="border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
            {error && <p role="alert" className="mb-3 text-sm font-medium text-red-800">{error}</p>}
            {message && (
              <p role="status" className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-800">
                {message.startsWith("Ekspor dibatalkan") ? <Info aria-hidden="true" className="size-4 shrink-0 text-slate-500" /> : <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-emerald-700" />}
                {message}
              </p>
            )}
            {warnings.map((warning) => <p key={warning} role="status" className="mb-3 text-xs leading-relaxed text-amber-900">{warning}</p>)}
            {!busy && effectiveFields.length === 0 && <p role="status" className="mb-2 text-xs font-semibold text-red-800">Pilih minimal satu kolom untuk mengunduh.</p>}
            <div className="flex flex-col items-start gap-x-3 gap-y-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm tabular-nums text-slate-600">
                <strong className="font-bold text-slate-950">{count.toLocaleString("id-ID")}</strong> artikel
                <span className="text-slate-500"> · </span>
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
