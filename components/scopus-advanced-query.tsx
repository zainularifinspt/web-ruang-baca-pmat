"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown, Copy, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const fieldGuides = [
  ["TITLE-ABS-KEY", "Judul, abstrak & kata kunci", 'TITLE-ABS-KEY("")'],
  ["TITLE", "Judul artikel", 'TITLE("")'],
  ["AUTH", "Nama penulis", 'AUTH("")'],
  ["AFFIL", "Afiliasi", 'AFFIL("")'],
  ["PUBYEAR", "Tahun publikasi", "PUBYEAR > 2020"],
  ["DOCTYPE", "Jenis dokumen", "DOCTYPE(ar)"],
  ["SRCTITLE", "Nama jurnal", 'SRCTITLE("")'],
  ["DOI", "DOI artikel", 'DOI("")'],
] as const;
const examples = [
  ["Literasi matematika", 'TITLE-ABS-KEY("mathematical literacy" OR "numeracy") AND DOCTYPE(ar)'],
  ["Rentang tahun", 'TITLE-ABS-KEY("realistic mathematics education") AND PUBYEAR > 2020 AND PUBYEAR < 2027'],
  ["Pengecualian topik", 'TITLE-ABS-KEY("mathematics education" AND NOT "higher education")'],
] as const;

export function ScopusAdvancedQuery({ value, onChange, onSearch, isPending }: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isPending: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  function insertField(snippet: string) {
    const input = inputRef.current;
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? value.length;
    const prefix = start > 0 && !/\s$/.test(value.slice(0, start)) ? " " : "";
    onChange(value.slice(0, start) + prefix + snippet + value.slice(end));
    requestAnimationFrame(() => {
      input?.focus();
      const position = start + prefix.length + (snippet.includes('""') ? snippet.indexOf('""') + 1 : snippet.length);
      input?.setSelectionRange(position, position);
    });
  }
  async function copyQuery() {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { toast.error("Query belum dapat disalin. Pilih teks lalu salin secara manual."); }
  }
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSearch(); }} className="mt-4">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2"><label htmlFor="scopus-advanced-query" className="text-sm font-bold text-slate-900">Tulis advanced query Anda</label><span className="text-xs text-slate-500">Sintaks Scopus · AND, OR, AND NOT</span></div>
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-50/70 focus-within:border-red-700 focus-within:ring-2 focus-within:ring-red-700/10">
        <textarea ref={inputRef} id="scopus-advanced-query" value={value} onChange={(event) => onChange(event.target.value)} maxLength={12000} rows={4} spellCheck={false} placeholder={'TITLE-ABS-KEY("mathematical literacy") AND PUBYEAR > 2020'} aria-describedby="scopus-advanced-help" onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); if (!isPending) onSearch(); } }} className="min-h-36 w-full resize-y bg-transparent p-4 font-mono text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-500 sm:p-5" />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white/80 px-4 py-2 text-xs text-slate-500"><span>{value.length.toLocaleString("id-ID")} / 12.000 karakter · Ctrl / ⌘ + Enter untuk mencari</span><button type="button" disabled={!value.trim()} onClick={copyQuery} className="flex min-h-8 items-center gap-1.5 rounded-lg px-2 font-semibold text-red-800 hover:bg-red-50 disabled:opacity-40">{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied ? "Tersalin" : "Salin query"}</button></div>
      </div>
      <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><p id="scopus-advanced-help" className="max-w-xl text-xs leading-relaxed text-slate-600">Query dikirim sesuai tulisan Anda, tanpa normalisasi kata kunci. Atur tahun, bahasa, dan jenis dokumen langsung di dalam query; filter pencarian biasa tidak diterapkan.</p><Button type="submit" disabled={isPending || !value.trim()} className="min-h-11 shrink-0 gap-2 rounded-xl bg-red-800 px-5 text-white hover:bg-red-900">{isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}Cari Scopus</Button></div>
      <details className="mt-4 border-t border-slate-200 pt-3"><summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 text-xs font-bold text-slate-700"><ChevronDown className="size-4" />Panduan field & contoh query</summary><div className="pt-3"><p className="mb-2 text-xs text-slate-600">Klik field untuk menyisipkannya pada posisi kursor.</p><div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">{fieldGuides.map(([field, description, snippet]) => <button type="button" key={field} onClick={() => insertField(snippet)} className="rounded-lg p-2 text-left hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-800"><span className="block font-mono text-xs font-bold text-red-800">{field}</span><span className="mt-1 block text-xs text-slate-600">{description}</span></button>)}</div><div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3"><span className="text-xs text-slate-600">Gunakan contoh:</span>{examples.map(([label, query]) => <button type="button" key={label} onClick={() => onChange(query)} className="min-h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-red-800 hover:border-red-300 hover:bg-red-50">{label}</button>)}</div><p className="mt-3 text-xs leading-relaxed text-slate-600">Gunakan tanda kurung untuk mengelompokkan logika, tanda kutip untuk frasa, serta W/n atau PRE/n untuk kedekatan kata. <a href="https://dev.elsevier.com/sc_search_tips.html" target="_blank" rel="noopener noreferrer" className="font-semibold text-red-800 underline underline-offset-2">Panduan sintaks Scopus</a></p></div></details>
    </form>
  );
}
