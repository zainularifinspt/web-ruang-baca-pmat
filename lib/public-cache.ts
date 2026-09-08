import "server-only";

import { unstable_cache } from "next/cache";
import { buildCatalogSearchItems } from "@/lib/catalog-search";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { hasValidSupabaseConfig } from "@/lib/supabase-config";
import { fetchCatalogData } from "@/lib/supabase";
import { fetchEbooksFromApi } from "@/lib/ebooks";

export const PUBLIC_REVALIDATE_SECONDS = 300;
export const PUBLIC_CATALOG_LIMIT = 500;
export const PUBLIC_SEARCH_LIMIT = 160;
export const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": `public, s-maxage=${PUBLIC_REVALIDATE_SECONDS}, stale-while-revalidate=3600`,
  "CDN-Cache-Control": `public, s-maxage=${PUBLIC_REVALIDATE_SECONDS}, stale-while-revalidate=3600`,
  "Vercel-CDN-Cache-Control": `public, s-maxage=${PUBLIC_REVALIDATE_SECONDS}, stale-while-revalidate=3600`,
};
export const PUBLIC_SHORT_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  "CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  "Vercel-CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};
export const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export const fetchPublicCatalogData = unstable_cache(
  async () => {
    return fetchCatalogData({
      visibility: "public",
      limit: PUBLIC_CATALOG_LIMIT,
      includePdfMetadata: true,
      includeInputMetadata: false,
    });
  },
  ["public-catalog-data-v2"],
  {
    revalidate: PUBLIC_REVALIDATE_SECONDS,
    tags: ["public-catalog"],
  },
);

export const fetchPublicVisitorRows = unstable_cache(
  async () => {
    if (!hasValidSupabaseConfig()) return [];
    try {
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase
        .from("attendance")
        .select("id, visited_at")
        .order("visited_at", { ascending: false })
        .limit(100);
      if (error) return [];
      return (data ?? []) as Array<{ id: string; visited_at: string }>;
    } catch {
      return [];
    }
  },
  ["public-visitor-rows-v1"],
  {
    revalidate: PUBLIC_REVALIDATE_SECONDS,
    tags: ["public-attendance", "public-landing"],
  },
);

export const fetchPublicSearchItems = unstable_cache(
  async () => {
    const { books, theses, error } = await fetchCatalogData({
      visibility: "public",
      limit: PUBLIC_SEARCH_LIMIT,
      includePdfMetadata: false,
      includeInputMetadata: false,
    });

    return {
      items: error ? [] : buildCatalogSearchItems({ books, theses, limit: PUBLIC_SEARCH_LIMIT }),
      error,
    };
  },
  ["public-catalog-search-v1"],
  {
    revalidate: PUBLIC_REVALIDATE_SECONDS,
    tags: ["public-catalog"],
  },
);

export const fetchPublicLandingStats = unstable_cache(
  async () => {
    if (!hasValidSupabaseConfig()) {
      const { ebooks } = await fetchEbooksFromApi().catch(() => ({ ebooks: [] }));
      return {
        bookCount: ebooks?.length ?? 0,
        thesisCount: 0,
        staffCount: 0,
        todayWebsiteVisits: 0,
      };
    }

    const today = getMakassarDateKey();
    const supabase = createSupabaseAdminClient();
    const [bookResult, thesisResult, staffResult, visitResult, { ebooks }] = await Promise.all([
      supabase
        .from("books")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("theses")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .in("role", ["admin", "petugas"]),
      supabase
        .from("website_visits")
        .select("id", { count: "exact", head: true })
        .eq("visit_date", today),
      fetchEbooksFromApi().catch(() => ({ ebooks: [] })),
    ]);

    const dbBookCount = bookResult.error ? 0 : bookResult.count ?? 0;
    const ebookCount = Array.isArray(ebooks) ? ebooks.length : 0;

    return {
      bookCount: dbBookCount + ebookCount,
      thesisCount: thesisResult.error ? 0 : thesisResult.count ?? 0,
      staffCount: staffResult.error ? 0 : staffResult.count ?? 0,
      todayWebsiteVisits: visitResult.error ? 0 : visitResult.count ?? 0,
    };
  },
  ["public-landing-stats-v3"],
  {
    revalidate: PUBLIC_REVALIDATE_SECONDS,
    tags: ["public-catalog", "public-landing"],
  },
);

function getMakassarDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
