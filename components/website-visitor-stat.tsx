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
      className="group flex items-center gap-4 apple-bento-card p-5 transition-all duration-300 w-full"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/15 to-amber-500/5 text-amber-700 border border-amber-200/60 shadow-2xs transition-transform duration-300 group-hover:scale-105">
        <TrendingUp className="size-5" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
          {count.toLocaleString("id-ID")}
        </span>
        <span className="block text-xs font-semibold text-slate-700">Total Pengunjung</span>
        <span className="mt-0.5 block text-xs text-slate-500">
          Total pengunjung website hari ini
        </span>
      </span>
    </FadeIn>
  );
}
