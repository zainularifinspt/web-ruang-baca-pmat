"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

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
    const loadTimer = window.setTimeout(() => {
      void loadCount();
    }, 0);

    let supabase: ReturnType<typeof getSupabaseClient> | null = null;

    try {
      supabase = getSupabaseClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel("landing-website-visits-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "website_visits" }, () => {
        void loadCount();
      })
      .subscribe();

    return () => {
      window.clearTimeout(loadTimer);
      if (supabase) void supabase.removeChannel(channel);
    };
  }, [loadCount]);

  return (
    <div className="group flex items-center gap-4 rounded-[2rem] border border-white/40 bg-white/45 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.03)] backdrop-blur-3xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-[0_24px_50px_rgba(15,23,42,0.06)]">
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
    </div>
  );
}
