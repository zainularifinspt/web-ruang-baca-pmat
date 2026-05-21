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
    emerald: "bg-gradient-to-br from-emerald-50 to-cyan-50 text-emerald-700 ring-emerald-100",
    blue: "bg-gradient-to-br from-sky-50 to-cyan-50 text-sky-700 ring-sky-100",
    amber: "bg-gradient-to-br from-amber-50 to-emerald-50 text-amber-700 ring-amber-100",
  };

  return (
    <Link
      href={href}
      className="group rounded-3xl border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:bg-white hover:shadow-xl hover:shadow-slate-950/10"
    >
      <div className="flex items-start justify-between gap-4">
        <div className={cn("rounded-2xl p-3 shadow-sm ring-1 transition duration-300 group-hover:scale-105", tones[tone])}>
          <Icon className="size-5" />
        </div>
        <span className="flex size-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-200 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:ring-emerald-100">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <h3 className="mt-5 font-bold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </Link>
  );
}
