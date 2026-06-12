import type { VisitorMetric } from "@/lib/types";

type VisitorChartProps = {
  metrics: VisitorMetric[];
};

export function VisitorBarChart({ metrics }: VisitorChartProps) {
  const max = Math.max(1, ...metrics.map((item) => item.visits));

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-4">
      <div className="flex h-72 items-end gap-2 sm:gap-3">
        {metrics.map((item) => (
          <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
            <div className="text-center text-xs font-semibold text-slate-700">{item.visits}</div>
            <div className="flex flex-1 items-end rounded-t-2xl bg-white/90 px-1 pt-3 shadow-inner ring-1 ring-slate-100">
              <div
                className="min-h-3 w-full rounded-t-xl bg-gradient-to-t from-red-700 via-rose-500 to-yellow-300 shadow-sm shadow-red-900/10 transition hover:from-red-800"
                style={{ height: `${Math.max(4, (item.visits / max) * 86)}%` }}
                aria-label={`${item.label}: ${item.visits} kunjungan`}
              />
            </div>
            <div className="text-center text-xs font-medium text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VisitorLineChart({ metrics }: VisitorChartProps) {
  const width = 560;
  const height = 220;
  const padding = 24;
  const max = Math.max(
    1,
    ...metrics.flatMap((item) => [item.books, item.theses]),
  );
  const pointsFor = (key: "books" | "theses") =>
    metrics
      .map((item, index) => {
        const x =
          padding +
          (index / Math.max(1, metrics.length - 1)) * (width - padding * 2);
        const y = height - padding - (item[key] / max) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-64 w-full overflow-visible"
        role="img"
        aria-label="Grafik minat koleksi buku dan skripsi"
      >
        <defs>
          <linearGradient id="books-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="theses-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padding + line * ((height - padding * 2) / 3);
          return (
            <line
              key={line}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="#dbe7ef"
              strokeDasharray="5 7"
            />
          );
        })}
        <polyline
          points={pointsFor("books")}
          fill="none"
          stroke="url(#books-line)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        <polyline
          points={pointsFor("theses")}
          fill="none"
          stroke="url(#theses-line)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        {metrics.flatMap((item, index) => {
          const x =
            padding +
            (index / Math.max(1, metrics.length - 1)) * (width - padding * 2);
          return (["books", "theses"] as const).map((key) => {
            const y = height - padding - (item[key] / max) * (height - padding * 2);
            return (
              <circle
                key={`${item.label}-${key}`}
                cx={x}
                cy={y}
                r="4"
                className={key === "books" ? "fill-yellow-600" : "fill-amber-600"}
                stroke="white"
                strokeWidth="2"
              />
            );
          });
        })}
        {metrics.map((item, index) => {
          const x =
            padding +
            (index / Math.max(1, metrics.length - 1)) * (width - padding * 2);
          return (
            <text
              key={item.label}
              x={x}
              y={height - 4}
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              {item.label}
            </text>
          );
        })}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-yellow-600" />
          Cari buku
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-amber-600" />
          Cari skripsi
        </span>
      </div>
    </div>
  );
}
