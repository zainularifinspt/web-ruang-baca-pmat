"use client";
import { useEffect, useState } from "react";
import { BookOpen, RefreshCw, Plus, Loader2 } from "lucide-react";
import { AdminPageHeading } from "@/components/admin-page-heading";
import { SectionCard } from "@/components/section-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
type Doc = {
  id: string;
  title: string;
  pages?: number;
  textPages?: number;
  ready: boolean;
};
type Job = {
  id: string;
  document_id: string;
  status: string;
  message?: string;
};
export function DocumentManager() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState("book");
  const [id, setId] = useState("");
  const [notice, setNotice] = useState("");
  const [aiReady, setAiReady] = useState(false);
  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/reader/manage");
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setDocs(d.documents);
      setJobs(d.jobs);
      setAiReady(d.aiReady);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Data belum tersedia.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const r = await fetch("/api/reader/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id: id.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setNotice(d.message);
      setId("");
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Antrean belum tersedia.");
    } finally {
      setBusy(false);
    }
  }
  const labels: Record<string, string> = {
    queued: "Dalam antrean",
    processing: "Sedang diproses",
    ready: "Siap dibaca",
    failed: "Perlu diperiksa",
  };
  return (
    <div className="space-y-6">
      <AdminPageHeading
        title="Dokumen digital"
        description="Siapkan flipbook, pencarian isi, dan sumber jawaban untuk koleksi ruang baca."
      />
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
        >
          {error}
        </p>
      )}
      <SectionCard
        title="Siapkan dokumen"
        description="Gunakan ID koleksi dari tautan detail buku atau skripsi yang sudah diterbitkan."
      >
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="book">Buku</SelectItem>
              <SelectItem value="thesis">Skripsi</SelectItem>
            </SelectContent>
          </Select>
          <Input
            aria-label="ID koleksi"
            placeholder="ID koleksi"
            value={id}
            onChange={(e) => setId(e.target.value)}
            maxLength={160}
            required
          />
          <Button disabled={busy || !id.trim()} type="submit">
            {busy ? <Loader2 className="animate-spin" /> : <Plus />}Masukkan
            antrean
          </Button>
        </form>
        {notice && (
          <p role="status" className="mt-3 text-sm text-slate-600">
            {notice}
          </p>
        )}
        <p className="mt-4 text-xs text-slate-500">
          {aiReady
            ? "Asisten AI telah dikonfigurasi."
            : "Asisten AI belum diaktifkan. Flipbook dan pencarian isi dapat disiapkan terlebih dahulu."}
        </p>
      </SectionCard>
      <SectionCard
        title="Koleksi siap dibaca"
        action={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw />
            Perbarui
          </Button>
        }
      >
        {loading ? (
          <p className="text-sm text-slate-500">Memuat dokumen…</p>
        ) : docs.length ? (
          <div className="divide-y divide-slate-100">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-4">
                <BookOpen className="size-5 shrink-0 text-rose-700" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {d.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {d.pages
                      ? `${d.pages} halaman · teks ${d.textPages} halaman`
                      : d.ready
                        ? "Siap dibaca dan dicari"
                        : "Belum siap"}
                  </p>
                </div>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700">
                  {d.ready ? "Siap" : "Diproses"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Belum ada dokumen yang selesai disiapkan.
          </p>
        )}
      </SectionCard>
      <SectionCard title="Antrean pemrosesan">
        {jobs.length ? (
          jobs.map((j) => (
            <div
              key={j.id}
              className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 text-xs"
            >
              <span className="min-w-0 truncate text-slate-600">
                {j.document_id}
              </span>
              <span className="shrink-0 font-semibold text-rose-700">
                {labels[j.status] || j.status}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">
            Tidak ada tugas dalam antrean.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
