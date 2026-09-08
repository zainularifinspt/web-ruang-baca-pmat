"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type ChartCoordinate = ChartPoint & {
  x: number;
  y: number;
};

export function RealtimeVisitorChart({
  initialRows = [],
}: {
  initialRows?: AttendanceRow[];
}) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [rows, setRows] = useState<AttendanceRow[]>(initialRows);
  const [isVisible, setIsVisible] = useState(initialRows.length > 0);
  const [isLoading, setIsLoading] = useState(initialRows.length === 0);
  const [error, setError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    try {
      const response = await fetch("/api/attendance?limit=120", { cache: "no-store" });
      const payload = (await response.json()) as { rows?: AttendanceRow[]; error?: string };
      if (!response.ok || payload.error) throw new Error(payload.error ?? "Gagal memuat data.");
      setRows(payload.rows ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data pengunjung.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    if (!("IntersectionObserver" in window)) {
      const timer = globalThis.setTimeout(() => setIsVisible(true), 0);
      return () => globalThis.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

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
  }, [isVisible, loadRows]);

  const points = useMemo(() => buildVisitorPoints(rows), [rows]);
  const totalVisitors = points.reduce((sum, point) => sum + point.value, 0);
  const previousTotal = rows.length > totalVisitors ? rows.length - totalVisitors : 0;
  const growth =
    previousTotal > 0 ? Math.round(((totalVisitors - previousTotal) / previousTotal) * 100) : null;

  if (isLoading) {
    return (
      <div ref={sectionRef} className="apple-bento-card p-6 sm:p-8">
        <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200/50" />
        <div className="mt-6 h-52 animate-pulse rounded-2xl bg-slate-100/40" />
      </div>
    );
  }

  return (
    <section ref={sectionRef} className="apple-bento-card p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50/80 px-2.5 py-0.5 text-[11px] font-bold text-red-800 border border-red-200/60 mb-1.5">
            <Activity className="size-3 text-red-600" />
            <span>Presensi Pengunjung</span>
          </div>
          <p className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Grafik Kunjungan Harian</p>
          <p className="mt-1 text-xs text-slate-500 font-normal">Pencatatan kehadiran digital per hari secara realtime.</p>
        </div>
        <div className="w-fit rounded-full bg-white/70 backdrop-blur-sm border border-slate-200/60 px-3.5 py-1 text-xs font-bold text-slate-700 shadow-2xs">
          7 hari terakhir
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 text-sm text-amber-900">
          {error}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[180px_1fr] lg:gap-8 lg:items-center">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Total Pengunjung</p>
            <div className="mt-1.5 flex items-center gap-2">
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                {totalVisitors.toLocaleString("id-ID")}
              </p>
              {growth !== null ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 border border-red-200/60">
                  <TrendingUp className="size-3" />
                  {growth}%
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-xs font-normal leading-relaxed text-slate-500">Kunjungan tercatat selama sepekan ke belakang.</p>
          </div>
          <VisitorLine points={points} />
        </div>
      )}
    </section>
  );
}

function VisitorLine({ points }: { points: ChartPoint[] }) {
  const width = 760;
  const height = 240;
  const paddingX = 24;
  const paddingTop = 40;
  const paddingBottom = 40;
  const max = Math.max(1, ...points.map((point) => point.value));
  const coordinates = points.map((point, index) => {
    const x = paddingX + (index / Math.max(1, points.length - 1)) * (width - paddingX * 2);
    const y = height - paddingBottom - (point.value / max) * (height - paddingTop - paddingBottom);
    return { ...point, x, y };
  });
  const line = buildSmoothLinePath(coordinates);

  return (
    <div className="w-full min-w-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label="Grafik pengunjung realtime"
      >
        <defs>
          <linearGradient id="visitor-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#e11d48" />
            <stop offset="60%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((lineIndex) => {
          const y = paddingTop + lineIndex * ((height - paddingTop - paddingBottom) / 2);
          return (
            <line
              key={lineIndex}
              x1={paddingX}
              x2={width - paddingX}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeOpacity="0.8"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          );
        })}
        <path d={line} fill="none" stroke="url(#visitor-line)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map((point) => (
          <g key={point.label}>
            <text
              x={point.x}
              y={Math.max(18, point.y - 14)}
              textAnchor="middle"
              className="fill-slate-900 font-extrabold text-[13px]"
            >
              {point.value}
            </text>
            <circle cx={point.x} cy={point.y} r="6" fill="#e11d48" stroke="white" strokeWidth="2.5" />
            <text
              x={point.x}
              y={height - 10}
              textAnchor="middle"
              className="fill-slate-500 font-semibold text-[12px]"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:hidden">
        {points.map((point) => (
          <div key={point.label} className="rounded-2xl border border-white/70 bg-white/50 backdrop-blur-md px-3 py-2 shadow-2xs">
            <p className="text-[11px] font-bold text-slate-500">{point.label}</p>
            <p className="mt-1 text-lg font-extrabold text-slate-950">{point.value.toLocaleString("id-ID")}</p>
          </div>
        ))}
      </div>
      {!points.some((point) => point.value > 0) ? (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200/40 bg-white/20 p-3 text-xs text-slate-400">
          <Activity className="size-4 text-red-600" />
          Belum ada presensi pada 7 hari terakhir.
        </div>
      ) : null}
    </div>
  );
}

function buildSmoothLinePath(points: ChartCoordinate[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const commands = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const previous = points[index - 1] ?? current;
    const afterNext = points[index + 2] ?? next;
    const smoothing = 0.18;
    const controlPointOneX = current.x + (next.x - previous.x) * smoothing;
    const controlPointOneY = current.y + (next.y - previous.y) * smoothing;
    const controlPointTwoX = next.x - (afterNext.x - current.x) * smoothing;
    const controlPointTwoY = next.y - (afterNext.y - current.y) * smoothing;

    commands.push(
      `C ${controlPointOneX} ${controlPointOneY}, ${controlPointTwoX} ${controlPointTwoY}, ${next.x} ${next.y}`,
    );
  }

  return commands.join(" ");
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
