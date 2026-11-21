"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_STORAGE_KEY = "ruang-baca-visitor-id";

export function WebsiteVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    const schedule = window.requestIdleCallback ?? ((callback: IdleRequestCallback) => window.setTimeout(callback, 1500));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;

    const trackId = schedule(() => {
      void fetch("/api/website-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, pagePath: pathname || "/" }),
        cache: "no-store",
        keepalive: true,
      }).catch(() => {
        // Tracking should never interrupt the visitor experience.
      });
    });

    return () => cancel(trackId);
  }, [pathname]);

  return null;
}

function getOrCreateVisitorId() {
  try {
    const existingVisitorId = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existingVisitorId) return existingVisitorId;

    const visitorId =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
    return visitorId;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
