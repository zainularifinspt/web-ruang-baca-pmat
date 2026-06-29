"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { FadeIn } from "@/components/ui/framer";

type WebsiteVisitorStatProps = {
  initialCount: number;
};

export function WebsiteVisitorStat({ initialCount }: WebsiteVisitorStatProps) {
  const [count, setCount] = useState(initialCount);

  const loadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/website-visits", { cache: "no-store" });
      const payload = (await response.json()) as { count?: number };

      if (response.ok && typeof payload.count === "number") {
        setCount(payload.count);
      }
    } catch {
      // Keep the last known value if realtime refresh fails.
    }
  }, []);

  useEffect(() => {
    const schedule = window.requestIdleCallback ?? ((callback: IdleRequestCallback) => window.setTimeout(callback, 1200));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const refreshId = schedule(() => {
      void loadCount();
    });

    return () => cancel(refreshId);
  }, [loadCount]);

  return (
    <FadeIn 
      whileHover={{ y: -4, scale: 1.01, transition: { type: "spring", stiffness: 450, damping: 25 } }}
      className="group flex items-center gap-4 rounded-[2rem] border border-white/40 bg-white/70 p-6 shadow-sm transition-all duration-200 hover:bg-white/90 w-full"
    >
      <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent text-amber-700 shadow-sm ring-1 ring-amber-100/50 transition-all duration-300 group-hover:scale-105">
        <TrendingUp className="size-6" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-3xl font-extrabold tracking-tight text-slate-900">
          {count.toLocaleString("id-ID")}
        </span>
        <span className="mt-0.5 block text-sm font-bold text-slate-800">Total Pengunjung</span>
        <span className="mt-0.5 block text-xs font-medium text-slate-400">
          Total pengunjung website hari ini
        </span>
      </span>
    </FadeIn>
  );
}
