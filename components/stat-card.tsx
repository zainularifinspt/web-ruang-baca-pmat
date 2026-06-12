import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  tone = "emerald",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trend?: string;
  tone?: "emerald" | "blue" | "amber" | "slate";
}) {
  const tones = {
    emerald: "bg-gradient-to-br from-red-50 to-yellow-50 text-red-700 ring-red-100",
    blue: "bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-700 ring-amber-100",
    amber: "bg-gradient-to-br from-amber-50 to-red-50 text-amber-700 ring-amber-100",
    slate: "bg-gradient-to-br from-slate-100 to-amber-50 text-slate-700 ring-slate-200",
  };

  return (
    <div className="group rounded-3xl border border-white/80 bg-white/80 p-5 shadow-sm shadow-slate-900/5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-red-100 hover:bg-white hover:shadow-xl hover:shadow-slate-950/10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <div className={cn("rounded-2xl p-3 shadow-sm ring-1 transition duration-300 group-hover:scale-105", tones[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
      {trend ? (
        <p className="mt-4 inline-flex max-w-full items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-100">
          <TrendingUp className="size-3" />
          <span className="truncate">{trend}</span>
        </p>
      ) : null}
    </div>
  );
}
