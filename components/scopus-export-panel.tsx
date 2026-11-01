"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, CheckCircle2, ChevronDown, Download, FileSpreadsheet, FileText, Info, Loader2, SlidersHorizontal, X } from "lucide-react";
import type { ScopusArticle, ScopusSearchResponse } from "@/lib/scopus";
import {
  assertScopusExportable, collectAllScopusArticles, createScopusExport, deduplicateScopusArticles,
  getScopusExportFields, scopusArticleNeedsMetadata, SCOPUS_CITATION_FIELDS, SCOPUS_EXPORT_FIELDS,
  SCOPUS_EXPORT_GROUPS, SCOPUS_EXPORT_LIMIT, SCOPUS_SLR_FIELDS,
  type ScopusExportFieldId, type ScopusExportFormat, type ScopusExportScope,
} from "@/lib/scopus-export";
import { Button } from "@/components/ui/button";

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
  { id: "xlsx", name: "Excel", extension: ".xlsx", description: "Tabel & screening", icon: FileSpreadsheet },
  { id: "csv", name: "CSV", extension: ".csv", description: "Olah data lanjutan", icon: FileText },
  { id: "ris", name: "RIS", extension: ".ris", description: "Aplikasi referensi", icon: BookOpen },
] as const;

// Give React a frame to paint the loading state before serializing a large workbook.
function paintExportState() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

export function ScopusExportPanel({ data, selected, allOnPageSelected, onTogglePage, onClear, onBusyChange }: Props) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<ScopusExportScope>("page");
  const [format, setFormat] = useState<ScopusExportFormat>("xlsx");
  const [fields, setFields] = useState<ScopusExportFieldId[]>(SCOPUS_CITATION_FIELDS);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<ExportStage>("collecting");
  const [progress, setProgress] = useState({ retrieved: 0, total: 0 });
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
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
    <section aria-label="Pemilihan dan ekspor artikel" className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <label className="flex min-h-9 cursor-pointer items-center gap-2 font-semibold">
            <input type="checkbox" checked={allOnPageSelected} disabled={busy || data.isDemo} onChange={onTogglePage} className="size-4 accent-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800" />Pilih halaman ini
          </label>
          <span aria-live="polite" className="text-xs text-slate-600">{selected.length} artikel terpilih lintas halaman</span>
          {selected.length > 0 && <button type="button" disabled={busy} onClick={onClear} className="min-h-9 text-xs font-semibold text-red-800 underline underline-offset-4 disabled:opacity-50">Hapus pilihan</button>}
        </div>
        {!open && <Button type="button" disabled={data.isDemo || !data.search} aria-expanded={false} aria-controls="scopus-export-options" onClick={() => { setOpen(true); setScope(selected.length ? "selected" : "page"); clearFeedback(); }} className="gap-2 rounded-xl bg-red-800 px-5 text-white hover:bg-red-900"><Download className="size-4" />Ekspor untuk SLR<ChevronDown className="size-4" /></Button>}
      </div>
      {open && <div id="scopus-export-options" className="border-t border-slate-200">
        <div className="flex items-start justify-between gap-4 px-4 pb-5 pt-5 sm:px-6">
          <div className="flex gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-800"><Download className="size-5" /></div>
            <div><h3 className="text-lg font-bold tracking-tight text-slate-950">Siapkan ekspor literatur</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">Tentukan artikel, format, dan data yang Anda perlukan.</p></div>
          </div>
          <button type="button" aria-label="Tutup opsi ekspor" disabled={busy} onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-red-800 disabled:opacity-40"><X className="size-5" /></button>
        </div>

        {busy ? <div ref={progressRef} role="status" aria-live="polite" aria-busy="true" className="flex min-h-96 scroll-mt-24 flex-col items-center justify-center bg-slate-50/70 px-5 py-10 text-center">
          <Loader2 className="mb-5 size-10 animate-spin text-red-800 motion-reduce:animate-none" />
          <h4 className="text-xl font-bold text-slate-950">{stages[stageIndex].label}…</h4>
          <p className="mt-2 text-sm text-slate-600">{stage === "generating" ? `${count.toLocaleString("id-ID")} artikel · ${effectiveFields.length} kolom · ${formatName}` : `${progress.retrieved.toLocaleString("id-ID")} dari ${progress.total.toLocaleString("id-ID")} artikel`}</p>
          <div role="progressbar" aria-label={stages[stageIndex].label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stage === "generating" ? undefined : Math.round(progress.retrieved / Math.max(1, progress.total) * 100)} className="mt-6 h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-200">
            <div className={`h-full rounded-full bg-red-800 transition-[width] duration-200 motion-reduce:transition-none ${stage === "generating" ? "w-1/3 animate-pulse motion-reduce:animate-none" : ""}`} style={stage === "generating" ? undefined : { width: `${progress.retrieved / Math.max(1, progress.total) * 100}%` }} />
          </div>
          <ol className="mt-7 flex w-full max-w-lg flex-col gap-3 text-left text-sm sm:flex-row sm:justify-between sm:gap-4">
            {stages.map((item, index) => <li key={item.id} className={`flex items-center gap-2 ${index === stageIndex ? "font-semibold text-red-900" : index < stageIndex ? "text-slate-700" : "text-slate-500"}`}>
              {index < stageIndex ? <CheckCircle2 className="size-4 text-emerald-700" /> : index === stageIndex ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <span className="size-3 rounded-full border border-slate-300" />}{item.label}
            </li>)}
          </ol>
          <p className="mt-7 max-w-md text-xs leading-relaxed text-slate-600">Anda dapat membatalkan proses kapan saja. File diunduh setelah seluruh tahap selesai.</p>
        </div> : <>
          <div className="grid gap-6 border-y border-slate-200 bg-slate-50/70 px-4 py-5 sm:px-6 lg:grid-cols-[.85fr_1.15fr]">
            <fieldset><legend className="mb-3 text-sm font-bold text-slate-900">Artikel yang diekspor</legend><div className="flex flex-col gap-1.5">
              {([
                ["selected", "Artikel terpilih", selected.length, selected.length === 0],
                ["page", "Halaman ini", data.articles.length, false],
                ["all", "Seluruh hasil pencarian", data.totalResults, allOverLimit],
              ] as const).map(([value, label, amount, unavailable]) => <label key={value} className={`flex min-h-9 items-center gap-2.5 text-sm ${unavailable ? "text-slate-500" : "cursor-pointer text-slate-700"}`}><input type="radio" name="scopus-export-scope" value={value} checked={scope === value} disabled={unavailable} onChange={() => { setScope(value); clearFeedback(); }} className="size-4 accent-red-800" /><span>{label}</span><span className="ml-1 rounded-md bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-600">{amount.toLocaleString("id-ID")}</span></label>)}
            </div>{allOverLimit && <p className="mt-2 text-xs leading-relaxed text-amber-900">Maksimal 5.000 artikel per ekspor seluruh hasil. Persempit pencarian dengan filter.</p>}</fieldset>
            <fieldset><legend className="mb-3 text-sm font-bold text-slate-900">Format file</legend><div className="grid grid-cols-3 gap-2">
              {formats.map((item) => <label key={item.id} className={`relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-red-800/30 sm:p-4 ${format === item.id ? "border-red-800 bg-red-50 text-red-950" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}>
                <input type="radio" name="scopus-export-format" aria-label={`${item.name} (${item.extension})`} checked={format === item.id} onChange={() => { setFormat(item.id); clearFeedback(); }} className="sr-only" />
                <div className="flex items-center justify-between gap-2"><item.icon className="size-5" />{format === item.id && <Check className="size-4 text-red-800" />}</div>
                <span className="text-sm font-bold">{item.name} <span className="text-xs font-normal">{item.extension}</span></span><span className="hidden text-xs leading-relaxed sm:block">{item.description}</span>
              </label>)}
            </div></fieldset>
          </div>
          <div className="px-4 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="flex items-center gap-2 text-sm font-bold text-slate-900"><SlidersHorizontal className="size-4 text-red-800" />Data yang disertakan<span className="ml-1 text-xs font-normal text-slate-600">{effectiveFields.length} kolom dipilih</span></h4><p className="mt-1.5 text-xs leading-relaxed text-slate-600">Pilih per kolom atau gunakan pilihan cepat.</p></div>
              <div className="flex flex-wrap gap-1.5" aria-label="Pilihan cepat kolom ekspor">{[
                ["Referensi dasar", SCOPUS_CITATION_FIELDS], ["Kebutuhan SLR", SCOPUS_SLR_FIELDS], ["Semua data", SCOPUS_EXPORT_FIELDS.map((field) => field.id)],
              ].map(([label, ids]) => <button key={String(label)} type="button" onClick={() => chooseFields(ids as ScopusExportFieldId[])} className="min-h-8 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-red-800 hover:border-red-300 hover:bg-red-50 hover:text-red-900 focus-visible:outline-2 focus-visible:outline-red-800">{String(label)}</button>)}</div>
            </div>
            {format === "ris" && <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-600"><Info className="mt-0.5 size-3.5 shrink-0" />Kolom screening tersedia di Excel/CSV. RIS menyimpan metadata tambahan tanpa tag khusus sebagai catatan referensi.</p>}
            <div className="mt-5 grid max-h-[28rem] gap-x-7 gap-y-6 overflow-y-auto overscroll-contain pr-1 md:grid-cols-2 lg:grid-cols-4">
              {SCOPUS_EXPORT_GROUPS.map((group) => {
                const groupFields = compatibleFields.filter((field) => field.group === group.id);
                const chosen = groupFields.filter((field) => fields.includes(field.id)).length;
                const allChosen = groupFields.length > 0 && chosen === groupFields.length;
                return <fieldset key={group.id} disabled={!groupFields.length} className="min-w-0">
                  <legend className="w-full border-b border-slate-200 pb-2.5"><label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-900"><input type="checkbox" disabled={!groupFields.length} checked={allChosen} aria-checked={chosen > 0 && !allChosen ? "mixed" : allChosen} ref={(element) => { if (element) element.indeterminate = chosen > 0 && !allChosen; }} onChange={() => chooseFields(allChosen ? fields.filter((id) => !groupFields.some((field) => field.id === id)) : [...new Set([...fields, ...groupFields.map((field) => field.id)])])} className="size-4 accent-red-800" />{group.label}<span className="ml-auto text-xs font-normal tabular-nums text-slate-500">{chosen}/{groupFields.length}</span></label></legend>
                  <p className="mb-2 mt-2 text-xs leading-relaxed text-slate-600">{group.description}</p>
                  {SCOPUS_EXPORT_FIELDS.filter((field) => field.group === group.id).map((field) => {
                    const unavailable = !groupFields.some((item) => item.id === field.id);
                    return <label key={field.id} className={`flex min-h-9 items-center gap-2.5 rounded-md px-1.5 py-1 text-sm ${unavailable ? "text-slate-400" : "cursor-pointer text-slate-700 hover:bg-slate-50"}`}><input type="checkbox" checked={!unavailable && fields.includes(field.id)} disabled={unavailable} onChange={() => toggleField(field.id)} className="size-4 shrink-0 rounded accent-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800" />{field.label}</label>;
                  })}
                </fieldset>;
              })}
            </div>
            <div className="mt-3 flex justify-end text-xs"><button type="button" onClick={() => chooseFields([])} className="min-h-8 shrink-0 font-semibold text-red-800 underline underline-offset-4">Kosongkan pilihan</button></div>
          </div>
        </>}
        <div className="border-t border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-6">
          {error && <p role="alert" className="mb-3 text-sm font-medium text-red-800">{error}</p>}
          {message && <p role="status" className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-800">{message.startsWith("Ekspor dibatalkan") ? <Info className="size-4 shrink-0 text-slate-500" /> : <CheckCircle2 className="size-4 shrink-0 text-emerald-700" />}{message}</p>}
          {warnings.map((warning) => <p key={warning} role="status" className="mb-3 text-xs leading-relaxed text-amber-900">{warning}</p>)}
          <div className="flex justify-end">
            <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end"><span className="text-xs font-medium tabular-nums text-slate-600">{count.toLocaleString("id-ID")} artikel · {effectiveFields.length} kolom</span>
              {busy ? <Button type="button" variant="outline" className="min-h-11 rounded-xl border-slate-300 bg-white" onClick={() => controllerRef.current?.abort()}><X className="mr-2 size-4" />Batalkan ekspor</Button> : <Button type="button" onClick={handleExport} disabled={disabled} className="min-h-11 gap-2 rounded-xl bg-red-800 px-5 text-white hover:bg-red-900"><Download className="size-4" />Ekspor {count.toLocaleString("id-ID")} artikel</Button>}
            </div>
          </div>
          {!busy && effectiveFields.length === 0 && <p role="status" className="mt-3 text-xs font-medium text-red-800">Pilih minimal satu kolom{format === "ris" ? " referensi" : ""} untuk mengaktifkan ekspor.</p>}
        </div>
      </div>}
    </section>
  );
}
