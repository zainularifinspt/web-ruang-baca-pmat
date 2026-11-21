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
  return (
    <div className={cn("admin-stat", `stat-${tone}`)}>
      <div className="flex items-center justify-between gap-2">
        <span className="admin-stat-icon">
          <Icon className="size-[18px]" />
        </span>
        <span className="admin-stat-dot" />
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-600 sm:text-sm">
        {label}
      </p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums text-slate-950 sm:text-4xl">
        {typeof value === "number" ? value.toLocaleString("id-ID") : value}
      </p>
      {trend && (
        <p className="mt-2 text-[10px] font-medium text-slate-500 sm:text-xs">
          {trend}
        </p>
      )}
    </div>
  );
}
