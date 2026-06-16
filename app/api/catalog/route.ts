import { NextResponse } from "next/server";
import {
  PRIVATE_NO_STORE_HEADERS,
  PUBLIC_CACHE_HEADERS,
  PUBLIC_CATALOG_LIMIT,
} from "@/lib/public-cache";
import { fetchCatalogData } from "@/lib/supabase";

export const revalidate = 300;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const visibility =
    url.searchParams.get("visibility") === "public" ? "public" : "internal";
  const isPublic = visibility === "public";
  const limit = isPublic
    ? boundedNumber(url.searchParams.get("limit"), PUBLIC_CATALOG_LIMIT, 1, PUBLIC_CATALOG_LIMIT)
    : boundedNumber(url.searchParams.get("limit"), 0, 0, 2000);
  const offset = boundedNumber(url.searchParams.get("offset"), 0, 0, 100_000);
  const { books, theses, error } = await fetchCatalogData({
    visibility,
    limit: limit || undefined,
    offset,
    includePdfMetadata: !isPublic,
    includeInputMetadata: !isPublic,
  });
  const headers = isPublic ? PUBLIC_CACHE_HEADERS : PRIVATE_NO_STORE_HEADERS;

  if (error) {
    return NextResponse.json({ books, theses, error }, { status: 200, headers });
  }

  return NextResponse.json({ books, theses, limit: limit || null, offset }, { status: 200, headers });
}

function boundedNumber(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(maximum, Math.max(minimum, Math.floor(parsed)));
}
