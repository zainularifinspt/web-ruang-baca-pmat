"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Flame,
  Clock,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type AttendanceRow = {
  id: string;
  visited_at: string;
};

type ChartPoint = {
  label: string;
  dayName: string;
  fullDate: string;
  value: number;
  dateKey: string;
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
  const [timeRange, setTimeRange] = useState<7 | 14>(7);
  const [chartStyle, setChartStyle] = useState<"bar" | "line">("bar");

  const loadRows = useCallback(async () => {
    try {
      const response = await fetch("/api/attendance?limit=140", { cache: "no-store" });
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

  const points = useMemo(() => buildVisitorPoints(rows, timeRange), [rows, timeRange]);
  const totalVisitors = points.reduce((sum, point) => sum + point.value, 0);
  const averageVisitors = (totalVisitors / Math.max(1, points.length)).toFixed(1);

  const peakPoint = useMemo(() => {
    return points.reduce((highest, current) => {
      return current.value > highest.value ? current : highest;
    }, points[0] ?? { value: 0, label: "-", fullDate: "-", dayName: "-", dateKey: "" });
  }, [points]);

  const todayPoint = points[points.length - 1] ?? { value: 0 };

  const growth = useMemo(() => {
    const today = new Date();
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const key = dateKey(new Date(row.visited_at));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const prevKeys = Array.from({ length: timeRange }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (timeRange * 2 - 1 - index));
      return dateKey(date);
    });

    const previousTotal = prevKeys.reduce((sum, key) => sum + (counts.get(key) ?? 0), 0);
    if (previousTotal === 0) return totalVisitors > 0 ? 100 : null;
    return Math.round(((totalVisitors - previousTotal) / previousTotal) * 100);
  }, [rows, timeRange, totalVisitors]);

  if (isLoading) {
    return (
      <div ref={sectionRef} className="apple-bento-card p-6 sm:p-8 lg:p-10">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-56 animate-pulse rounded-xl bg-slate-200/60" />
            <div className="h-4 w-72 animate-pulse rounded-lg bg-slate-100/60" />
          </div>
          <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200/50" />
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100/60" />
          ))}
        </div>
        <div className="mt-6 h-72 sm:h-96 animate-pulse rounded-3xl bg-slate-100/40" />
      </div>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="apple-bento-card relative overflow-hidden p-6 sm:p-8 lg:p-10 hover:translate-y-0 shadow-xl shadow-slate-900/5"
    >
      {/* Subtle Mathematical Coordinate Geometry Watermark */}
      <div
        className="pointer-events-none absolute -bottom-10 -right-10 select-none opacity-[0.035] text-slate-950"
        aria-hidden="true"
      >
        <svg width="340" height="340" viewBox="0 0 340 340" fill="none" stroke="currentColor">
          <circle cx="170" cy="170" r="45" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="170" cy="170" r="95" strokeWidth="1" />
          <circle cx="170" cy="170" r="145" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="170" y1="10" x2="170" y2="330" strokeWidth="1.2" />
          <line x1="10" y1="170" x2="330" y2="170" strokeWidth="1.2" />
          <path d="M 30 170 Q 100 70, 170 170 T 310 170" strokeWidth="1.5" strokeDasharray="5 5" />
        </svg>
      </div>

      {/* Header with Title and Interactive Controls */}
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Grafik Kunjungan Harian
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 font-normal">
            Pencatatan kehadiran digital per hari secara realtime dari sistem presensi Ruang Baca.
          </p>
        </div>

        {/* Right Status Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Realtime Live Pulse */}
          <div className="flex items-center gap-2 rounded-full border border-emerald-300/80 bg-emerald-50/90 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
            </span>
            <span className="hidden xs:inline">Live Sync</span>
          </div>

          {/* Visualization Style Toggle (Batang vs Kurva) */}
          <div className="inline-flex rounded-xl border border-slate-200/80 bg-slate-100/90 p-1 text-xs font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setChartStyle("bar")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1 transition-all cursor-pointer",
                chartStyle === "bar"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
              title="Tampilan Diagram Batang Modern"
            >
              <BarChart3 className="size-3.5 text-rose-600" />
              <span>Batang</span>
            </button>
            <button
              type="button"
              onClick={() => setChartStyle("line")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1 transition-all cursor-pointer",
                chartStyle === "line"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
              title="Tampilan Kurva Area Halus"
            >
              <TrendingUp className="size-3.5 text-rose-600" />
              <span>Kurva</span>
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="inline-flex rounded-xl border border-slate-200/80 bg-slate-100/90 p-1 text-xs font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setTimeRange(7)}
              className={cn(
                "rounded-lg px-2.5 sm:px-3 py-1 transition-all cursor-pointer",
                timeRange === 7
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => setTimeRange(14)}
              className={cn(
                "rounded-lg px-2.5 sm:px-3 py-1 transition-all cursor-pointer",
                timeRange === 14
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              14 Hari
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-sm text-amber-900">
          {error}
        </div>
      ) : (
        <>
          {/* Key Metrics KPI Grid */}
          <div className="relative z-10 mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {/* Total Visitors */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-2xs backdrop-blur-md transition-all hover:bg-white hover:border-red-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  Total Pengunjung
                </span>
                <span className="flex size-7 items-center justify-center rounded-xl bg-red-50 text-red-700 border border-red-200/60">
                  <Users className="size-3.5" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                  {totalVisitors.toLocaleString("id-ID")}
                </span>
                {growth !== null ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold border",
                      growth >= 0
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                        : "bg-red-50 text-red-800 border-red-200/80"
                    )}
                  >
                    {growth >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                    {growth >= 0 ? `+${growth}%` : `${growth}%`}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-slate-500 font-normal">
                {timeRange} hari terakhir
              </p>
            </div>

            {/* Daily Average */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-2xs backdrop-blur-md transition-all hover:bg-white hover:border-red-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  Rata-rata Harian
                </span>
                <span className="flex size-7 items-center justify-center rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60">
                  <Activity className="size-3.5" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                  {averageVisitors}
                </span>
                <span className="text-xs font-semibold text-slate-500">orang / hari</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 font-normal">
                Estimasi frekuensi presensi
              </p>
            </div>

            {/* Peak Day */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-2xs backdrop-blur-md transition-all hover:bg-white hover:border-red-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  Puncak Kunjungan
                </span>
                <span className="flex size-7 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60">
                  <Flame className="size-3.5" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                  {peakPoint.value}
                </span>
                <span className="text-xs font-semibold text-slate-500">orang</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 font-normal truncate" title={peakPoint.fullDate}>
                {peakPoint.value > 0 ? `Tertinggi pd ${peakPoint.label}` : "Belum ada rekor"}
              </p>
            </div>

            {/* Today's Visits */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-2xs backdrop-blur-md transition-all hover:bg-white hover:border-red-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  Hari Ini
                </span>
                <span className="flex size-7 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60">
                  <Clock className="size-3.5" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                  {todayPoint.value}
                </span>
                <span className="text-xs font-semibold text-slate-500">orang</span>
              </div>
              <p className="mt-1 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Presensi terdata hari ini
              </p>
            </div>
          </div>

          {/* Expansive Full-Width Interactive Chart */}
          <div className="relative z-10 mt-6 sm:mt-8">
            <VisitorVisualization
              points={points}
              totalVisitors={totalVisitors}
              averageVisitors={averageVisitors}
              peakPoint={peakPoint}
              chartStyle={chartStyle}
              timeRange={timeRange}
            />
          </div>
        </>
      )}
    </section>
  );
}

function VisitorVisualization({
  points,
  totalVisitors,
  averageVisitors,
  peakPoint,
  chartStyle,
  timeRange,
}: {
  points: ChartPoint[];
  totalVisitors: number;
  averageVisitors: string;
  peakPoint: ChartPoint;
  chartStyle: "bar" | "line";
  timeRange: number;
}) {
  const width = 1000;
  const height = 360;
  const paddingLeft = 54;
  const paddingRight = 40;
  const paddingTop = 44;
  const paddingBottom = 48;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const maxValue = Math.max(0, ...points.map((p) => p.value));

  // Clean mathematical scale intervals
  let tickStep = 2;
  if (maxValue <= 4) tickStep = 1;
  else if (maxValue <= 8) tickStep = 2;
  else if (maxValue <= 16) tickStep = 4;
  else if (maxValue <= 28) tickStep = 7;
  else if (maxValue <= 50) tickStep = 10;
  else tickStep = Math.ceil(maxValue / 4 / 5) * 5;

  const scaleMax = Math.max(tickStep * 4, Math.ceil((maxValue * 1.18) / tickStep) * tickStep);
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((scaleMax / tickCount) * (tickCount - i)),
  );

  const count = points.length;
  const slotWidth = chartWidth / Math.max(1, count);
  const barWidth = timeRange === 7 ? 48 : 24;

  const coordinates: ChartCoordinate[] = points.map((point, index) => {
    // For bar chart: center of each slot. For line chart: evenly spaced across chart width
    const x =
      chartStyle === "bar"
        ? paddingLeft + (index + 0.5) * slotWidth
        : paddingLeft + (index / Math.max(1, count - 1)) * chartWidth;
    const y = height - paddingBottom - (point.value / scaleMax) * chartHeight;
    return { ...point, x, y };
  });

  const avgValueNumber = Number(averageVisitors) || 0;
  const avgY = height - paddingBottom - (avgValueNumber / scaleMax) * chartHeight;

  const linePath = buildSmoothLinePath(coordinates, height - paddingBottom);
  const areaPath = buildAreaPath(coordinates, height - paddingBottom);

  const activeCoord = hoveredIndex !== null ? coordinates[hoveredIndex] : null;

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || coordinates.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * width;

    let closestIndex = 0;
    let minDistance = Infinity;
    coordinates.forEach((coord, idx) => {
      const dist = Math.abs(coord.x - svgX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    setHoveredIndex(closestIndex);
  };

  const handlePointerLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div className="relative w-full min-w-0">
      {/* Floating Interactive Tooltip */}
      {activeCoord && (
        <div
          className="pointer-events-none absolute z-30 transition-all duration-150 ease-out"
          style={{
            left: `${(activeCoord.x / width) * 100}%`,
            top: `${(activeCoord.y / height) * 100}%`,
            transform:
              activeCoord.y < 120
                ? "translate(-50%, 20px)"
                : "translate(-50%, -100%) translateY(-22px)",
          }}
        >
          <div className="rounded-2xl border border-white/95 bg-white/95 px-4 py-3 shadow-xl shadow-red-950/12 backdrop-blur-xl ring-1 ring-slate-900/5 text-center min-w-[140px] select-none">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {activeCoord.fullDate}
            </p>
            <div className="mt-1 flex items-baseline justify-center gap-1.5">
              <span className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
                {activeCoord.value}
              </span>
              <span className="text-xs font-bold text-slate-600">Pengunjung</span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold">
              {activeCoord.value === peakPoint.value && activeCoord.value > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 border border-amber-200">
                  🔥 Puncak Periode
                </span>
              ) : activeCoord.value >= avgValueNumber ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 border border-emerald-200">
                  ▲ Di Atas Rata-rata
                </span>
              ) : activeCoord.value > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-700 border border-slate-200">
                  ▼ Di Bawah Rata-rata
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-500 border border-slate-200">
                  Libur / Nihil
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] font-medium text-slate-400">
              {totalVisitors > 0
                ? `${Math.round((activeCoord.value / totalVisitors) * 100)}% dari total pekan`
                : "0%"}
            </p>
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none cursor-crosshair"
        role="img"
        aria-label="Visualisasi data kehadiran harian"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <defs>
          {/* Bar Fill Gradient: Normal Days */}
          <linearGradient id="bar-gradient-normal" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#be123c" />
            <stop offset="60%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>

          {/* Bar Fill Gradient: Peak Day */}
          <linearGradient id="bar-gradient-peak" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#be123c" />
            <stop offset="45%" stopColor="#f43f5e" />
            <stop offset="85%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          {/* Line Stroke Gradient */}
          <linearGradient id="line-gradient-vibrant" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e11d48" />
            <stop offset="50%" stopColor="#be123c" />
            <stop offset="85%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          {/* Soft Ethereal Area Gradient */}
          <linearGradient id="area-gradient-ethereal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.22" />
            <stop offset="40%" stopColor="#fb7185" stopOpacity="0.08" />
            <stop offset="90%" stopColor="#fda4af" stopOpacity="0.01" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Bar Drop Shadow Glow */}
          <filter id="bar-hover-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#be123c" floodOpacity="0.28" />
          </filter>

          {/* Line Drop Shadow */}
          <filter id="line-drop-shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#be123c" floodOpacity="0.20" />
          </filter>
        </defs>

        {/* Y-Axis Horizontal Grid Lines & Scale Numbers */}
        {ticks.map((tick, index) => {
          const y = paddingTop + (index / tickCount) * chartHeight;
          const isBase = tick === 0;
          return (
            <g key={tick}>
              <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={y}
                y2={y}
                stroke={isBase ? "#cbd5e1" : "#f1f5f9"}
                strokeWidth={isBase ? "1.5" : "1"}
                strokeDasharray={isBase ? undefined : "4 6"}
              />
              <text
                x={paddingLeft - 14}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[11px] font-semibold tabular-nums select-none"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Average Attendance (x̄) Horizontal Reference Line */}
        {avgValueNumber > 0 && avgY > paddingTop && avgY < height - paddingBottom && (
          <g className="transition-all duration-300">
            <line
              x1={paddingLeft}
              x2={width - paddingRight - 82}
              y1={avgY}
              y2={avgY}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.85"
            />
            <g transform={`translate(${width - paddingRight - 78}, ${avgY - 10})`}>
              <rect width="78" height="20" rx="10" fill="#fffbeb" stroke="#fde68a" strokeWidth="1" />
              <text
                x="39"
                y="14"
                textAnchor="middle"
                className="fill-amber-800 text-[10px] font-extrabold select-none"
              >
                Rata²: {averageVisitors}
              </text>
            </g>
          </g>
        )}

        {/* ================= BAR CHART MODE ================= */}
        {chartStyle === "bar" && (
          <g>
            {coordinates.map((point, index) => {
              const isHovered = hoveredIndex === index;
              const isPeak = point.value === peakPoint.value && point.value > 0;
              const barHeightValue = Math.max(0, (point.value / scaleMax) * chartHeight);
              const barActualHeight = point.value > 0 ? Math.max(10, barHeightValue) : 4;
              const barY = height - paddingBottom - barActualHeight;
              const barX = point.x - barWidth / 2;

              // Background Ghost Track
              const trackWidth = barWidth + 14;
              const trackX = point.x - trackWidth / 2;

              return (
                <g
                  key={point.dateKey || point.label}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredIndex(index)}
                >
                  {/* Subtle Background Slot Track */}
                  <rect
                    x={trackX}
                    y={paddingTop}
                    width={trackWidth}
                    height={chartHeight}
                    rx="14"
                    fill={isHovered ? "rgba(244, 63, 94, 0.06)" : "rgba(248, 250, 252, 0.7)"}
                    stroke={isHovered ? "rgba(244, 63, 94, 0.2)" : "transparent"}
                    strokeWidth="1"
                    className="transition-colors duration-200"
                  />

                  {/* Main Rounded Pillar / Bar */}
                  {point.value > 0 ? (
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barActualHeight}
                      rx={Math.min(12, barWidth / 2)}
                      fill={isPeak ? "url(#bar-gradient-peak)" : "url(#bar-gradient-normal)"}
                      filter={isHovered ? "url(#bar-hover-glow)" : undefined}
                      className={cn(
                        "transition-all duration-200",
                        isHovered ? "opacity-100" : "opacity-95",
                      )}
                    />
                  ) : (
                    /* Zero Day Minimal Indicator */
                    <rect
                      x={barX}
                      y={height - paddingBottom - 4}
                      width={barWidth}
                      height="4"
                      rx="2"
                      fill="#cbd5e1"
                    />
                  )}

                  {/* Value Pill Badge Atop Bar */}
                  {point.value > 0 ? (
                    <g transform={`translate(${point.x}, ${barY - 14})`}>
                      <rect
                        x="-14"
                        y="-10"
                        width="28"
                        height="18"
                        rx="6"
                        fill="#ffffff"
                        stroke={isPeak ? "#fbbf24" : isHovered ? "#f43f5e" : "#e2e8f0"}
                        strokeWidth={isPeak || isHovered ? "1.5" : "1"}
                        className="shadow-2xs"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        className={cn(
                          "text-[11px] font-black tabular-nums select-none",
                          isPeak ? "fill-amber-700" : isHovered ? "fill-red-700" : "fill-slate-900",
                        )}
                      >
                        {point.value}
                      </text>
                    </g>
                  ) : (
                    <text
                      x={point.x}
                      y={height - paddingBottom - 10}
                      textAnchor="middle"
                      className="fill-slate-400 text-[10px] font-bold select-none"
                    >
                      0
                    </text>
                  )}

                  {/* X-Axis Day & Date Labels (Two-Tier) */}
                  <text
                    x={point.x}
                    y={height - paddingBottom + 18}
                    textAnchor="middle"
                    className={cn(
                      "text-[11px] select-none transition-colors duration-200",
                      isHovered ? "fill-red-700 font-extrabold" : "fill-slate-700 font-bold",
                    )}
                  >
                    {point.dayName}
                  </text>
                  <text
                    x={point.x}
                    y={height - paddingBottom + 32}
                    textAnchor="middle"
                    className={cn(
                      "text-[10px] select-none transition-colors duration-200",
                      isHovered ? "fill-red-700 font-bold" : "fill-slate-400 font-medium",
                    )}
                  >
                    {point.label}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ================= LINE / CURVE MODE ================= */}
        {chartStyle === "line" && (
          <g>
            {/* Background Column Strips */}
            {coordinates.map((point, index) => {
              const isHovered = hoveredIndex === index;
              const stripWidth = chartWidth / count;
              const stripX = point.x - stripWidth / 2;

              return (
                <rect
                  key={`strip-${point.dateKey || point.label}`}
                  x={stripX}
                  y={paddingTop}
                  width={stripWidth}
                  height={chartHeight}
                  rx="10"
                  fill={isHovered ? "rgba(244, 63, 94, 0.07)" : "rgba(248, 250, 252, 0.5)"}
                  className="transition-colors duration-150"
                />
              );
            })}

            {/* Smooth Ethereal Area Wash */}
            <path
              d={areaPath}
              fill="url(#area-gradient-ethereal)"
              className="transition-all duration-500 ease-out"
            />

            {/* Soft Ambient Line Glow */}
            <path
              d={linePath}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.14"
              className="transition-all duration-500 ease-out"
            />

            {/* Main Vector Spline Stroke */}
            <path
              d={linePath}
              fill="none"
              stroke="url(#line-gradient-vibrant)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#line-drop-shadow)"
              className="transition-all duration-500 ease-out"
            />

            {/* Active Vertical Inspection Crosshair */}
            {activeCoord && (
              <line
                x1={activeCoord.x}
                x2={activeCoord.x}
                y1={paddingTop}
                y2={height - paddingBottom}
                stroke="#e11d48"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.85"
              />
            )}

            {/* Data Nodes & Floating Chips */}
            {coordinates.map((point, index) => {
              const isHovered = hoveredIndex === index;
              const isPeak = point.value === peakPoint.value && point.value > 0;

              return (
                <g key={point.dateKey || point.label} className="cursor-pointer">
                  {/* Floating Value Pill Badge */}
                  <g transform={`translate(${point.x}, ${point.y - 18})`}>
                    <rect
                      x="-14"
                      y="-10"
                      width="28"
                      height="18"
                      rx="6"
                      fill="#ffffff"
                      stroke={isPeak ? "#fbbf24" : isHovered ? "#f43f5e" : "#e2e8f0"}
                      strokeWidth={isPeak || isHovered ? "1.5" : "1"}
                      className="shadow-2xs"
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      className={cn(
                        "text-[11px] font-black tabular-nums select-none",
                        isPeak ? "fill-amber-700" : isHovered ? "fill-red-700" : "fill-slate-900",
                      )}
                    >
                      {point.value}
                    </text>
                  </g>

                  {/* Peak Pulse Halo */}
                  {isPeak && !isHovered && (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="12"
                      fill="#f59e0b"
                      fillOpacity="0.22"
                      className="animate-pulse"
                    />
                  )}

                  {/* Hover Pulse Halo */}
                  {isHovered && (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="14"
                      fill="#f43f5e"
                      fillOpacity="0.25"
                      className="animate-pulse"
                    />
                  )}

                  {/* Circular Node */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isHovered ? "7" : "5"}
                    fill={isPeak ? "#f59e0b" : "#e11d48"}
                    stroke="#ffffff"
                    strokeWidth={isHovered ? "2.5" : "2"}
                    className="transition-all duration-200"
                  />

                  {/* X-Axis Day & Date Labels (Two-Tier) */}
                  <text
                    x={point.x}
                    y={height - paddingBottom + 18}
                    textAnchor="middle"
                    className={cn(
                      "text-[11px] select-none transition-colors duration-200",
                      isHovered ? "fill-red-700 font-extrabold" : "fill-slate-700 font-bold",
                    )}
                  >
                    {point.dayName}
                  </text>
                  <text
                    x={point.x}
                    y={height - paddingBottom + 32}
                    textAnchor="middle"
                    className={cn(
                      "text-[10px] select-none transition-colors duration-200",
                      isHovered ? "fill-red-700 font-bold" : "fill-slate-400 font-medium",
                    )}
                  >
                    {point.label}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Empty State Notification */}
      {!points.some((point) => point.value > 0) ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-slate-200/60 bg-white/50 p-4 text-xs font-semibold text-slate-500">
          <Sparkles className="size-4 text-amber-500" />
          Belum ada data presensi yang tercatat untuk periode ini.
        </div>
      ) : null}
    </div>
  );
}

function buildSmoothLinePath(points: ChartCoordinate[], bottomY: number) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  const commands = [`M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const previous = points[index - 1] ?? current;
    const afterNext = points[index + 2] ?? next;
    const smoothing = 0.18;
    let cp1x = current.x + (next.x - previous.x) * smoothing;
    let cp1y = current.y + (next.y - previous.y) * smoothing;
    let cp2x = next.x - (afterNext.x - current.x) * smoothing;
    let cp2y = next.y - (afterNext.y - current.y) * smoothing;

    // Clamp control points so spline curve never dips below the baseline
    if (current.y >= bottomY && next.y >= bottomY) {
      cp1y = bottomY;
      cp2y = bottomY;
    } else {
      cp1y = Math.min(bottomY, cp1y);
      cp2y = Math.min(bottomY, cp2y);
    }

    commands.push(
      `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`,
    );
  }

  return commands.join(" ");
}

function buildAreaPath(points: ChartCoordinate[], bottomY: number) {
  if (points.length === 0) return "";
  const linePath = buildSmoothLinePath(points, bottomY);
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  return `${linePath} L ${lastPoint.x.toFixed(1)} ${bottomY.toFixed(1)} L ${firstPoint.x.toFixed(1)} ${bottomY.toFixed(1)} Z`;
}

function buildVisitorPoints(rows: AttendanceRow[], daysCount: number) {
  const today = new Date();
  const days = Array.from({ length: daysCount }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (daysCount - 1 - index));
    return date;
  });
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const key = dateKey(new Date(row.visited_at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return days.map((date) => {
    const key = dateKey(date);
    const dayName = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Makassar",
      weekday: "short",
    }).format(date);
    const dateLabel = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Makassar",
      day: "numeric",
      month: "short",
    }).format(date);
    const fullDate = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Makassar",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);

    return {
      label: dateLabel,
      dayName,
      fullDate,
      value: counts.get(key) ?? 0,
      dateKey: key,
    };
  });
}

function dateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
