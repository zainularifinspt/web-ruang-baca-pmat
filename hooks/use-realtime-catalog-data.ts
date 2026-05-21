"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { Book, Thesis } from "@/lib/types";

type CatalogPayload = {
  books?: Book[];
  theses?: Thesis[];
  error?: string;
};

export function useRealtimeCatalogData() {
  const [books, setBooks] = useState<Book[]>([]);
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadCatalog() {
      try {
        const response = await fetch("/api/catalog?visibility=internal", {
          cache: "no-store",
        });
        const payload = (await response.json()) as CatalogPayload;

        if (!response.ok) {
          throw new Error(payload.error ?? "Gagal memuat data katalog");
        }

        if (!isActive) return;

        setBooks(payload.books ?? []);
        setTheses(payload.theses ?? []);
        setError(payload.error ?? null);
      } catch (caughtError) {
        if (!isActive) return;

        setBooks([]);
        setTheses([]);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Gagal memuat data katalog",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    const loadTimer = window.setTimeout(() => {
      void loadCatalog();
    }, 0);

    let supabase: ReturnType<typeof getSupabaseClient> | null = null;

    try {
      supabase = getSupabaseClient();
    } catch {
      return () => {
        isActive = false;
        window.clearTimeout(loadTimer);
      };
    }

    const channel = supabase
      .channel("catalog-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "books" }, () => {
        void loadCatalog();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "theses" }, () => {
        void loadCatalog();
      })
      .subscribe();

    return () => {
      isActive = false;
      window.clearTimeout(loadTimer);
      if (supabase) void supabase.removeChannel(channel);
    };
  }, []);

  const collections = useMemo(
    () =>
      [...books, ...theses].sort((first, second) => {
        const dateDifference =
          Date.parse(second.createdAt) - Date.parse(first.createdAt);
        if (Number.isFinite(dateDifference) && dateDifference !== 0) {
          return dateDifference;
        }

        return second.year - first.year;
      }),
    [books, theses],
  );

  return { books, theses, collections, isLoading, error };
}
