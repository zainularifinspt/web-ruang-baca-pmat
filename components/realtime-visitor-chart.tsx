"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, TrendingUp } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

type AttendanceRow = {
  id: string;
  visited_at: string;
};

type ChartPoint = {
  label: string;
  value: number;
};

export function RealtimeVisitorChart() {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRows() {
    try {
      const response = await fetch("/api/attendance?limit=500", { cache: "no-store" });
      const payload = (await response.json()) as { rows?: AttendanceRow[]; error?: string };
      if (!response.ok || payload.error) throw new Error(payload.error ?? "Gagal memuat data.");
      setRows(payload.rows ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data pengunjung.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadRows();
    }, 0);

    let supabase: ReturnType<typeof getSupabaseClient> | null = null;

    try {
      supabase = getSupabaseClient();
    } catch {
      window.clearTimeout(loadTimer);
      return;
    }

    const channel = supabase
      .channel("landing-attendance-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => {
        void loadRows();
      })
      .subscribe();

    return () => {
      window.clearTimeout(loadTimer);
      if (supabase) void supabase.removeChannel(channel);
    };
  }, []);

  const points = useMemo(() => buildVisitorPoints(rows), [rows]);
  const totalVisitors = points.reduce((sum, point) => sum + point.value, 0);
  const previousTotal = rows.length > totalVisitors ? rows.length - totalVisitors : 0;
  const growth =
    previousTotal > 0 ? Math.round(((totalVisitors - previousTotal) / previousTotal) * 100) : null;

  if (isLoading) {
    return (
      <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-5 h-44 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  return (
    <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-slate-950">Grafik Pengunjung</p>
          <p className="mt-1 text-sm text-slate-500">Realtime dari tabel presensi Supabase.</p>
        </div>
        <div className="w-fit rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
          7 hari terakhir
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Pengunjung</p>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-4xl font-semibold tracking-tight text-slate-950">
                {totalVisitors.toLocaleString("id-ID")}
              </p>
              {growth !== null ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                  <TrendingUp className="size-3" />
                  {growth}%
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">berdasarkan presensi 7 hari terakhir</p>
          </div>
          <VisitorLine points={points} />
        </div>
      )}
    </section>
  );
}

function VisitorLine({ points }: { points: ChartPoint[] }) {
  const width = 760;
  const height = 220;
  const paddingX = 34;
  const paddingY = 28;
  const max = Math.max(1, ...points.map((point) => point.value));
  const coordinates = points.map((point, index) => {
    const x = paddingX + (index / Math.max(1, points.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (point.value / max) * (height - paddingY * 2);
    return { ...point, x, y };
  });
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${paddingX},${height - paddingY} ${line} ${width - paddingX},${height - paddingY}`;

  return (
    <div className="min-w-0">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Grafik pengunjung realtime">
        <defs>
          <linearGradient id="visitor-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((lineIndex) => {
          const y = paddingY + lineIndex * ((height - paddingY * 2) / 2);
          return <line key={lineIndex} x1={paddingX} x2={width - paddingX} y1={y} y2={y} stroke="#e2e8f0" />;
        })}
        <polygon points={area} fill="url(#visitor-area)" />
        <polyline points={line} fill="none" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="5" fill="#0f766e" stroke="white" strokeWidth="3" />
            <text x={point.x} y={height - 6} textAnchor="middle" className="fill-slate-500 text-xs">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
      {!points.some((point) => point.value > 0) ? (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
          <Activity className="size-4" />
          Belum ada presensi pada 7 hari terakhir.
        </div>
      ) : null}
    </div>
  );
}

function buildVisitorPoints(rows: AttendanceRow[]) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return date;
  });
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const key = dateKey(new Date(row.visited_at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return days.map((date) => ({
    label: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(date),
    value: counts.get(dateKey(date)) ?? 0,
  }));
}

function dateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
