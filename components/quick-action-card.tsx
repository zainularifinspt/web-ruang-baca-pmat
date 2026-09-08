import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  tone = "emerald",
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tone?: "emerald" | "blue" | "amber";
}) {
  const tones = {
    emerald: "bg-red-50 text-red-700 border-red-200/60",
    blue: "bg-amber-50 text-amber-800 border-amber-200/60",
    amber: "bg-orange-50 text-orange-800 border-orange-200/60",
  };

  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className={cn("rounded-lg p-2.5 border transition duration-200 group-hover:scale-105", tones[tone])}>
          <Icon className="size-5" />
        </div>
        <span className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
          <ArrowUpRight className="size-3.5" />
        </span>
      </div>
      <h3 className="mt-4 font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>
    </Link>
  );
}
