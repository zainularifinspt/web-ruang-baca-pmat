import { NextRequest, NextResponse } from "next/server";
import { ScopusQueryError, searchScopusArticles } from "@/lib/scopus";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";
    const queryMode = searchParams.get("queryMode") === "advanced" ? "advanced" : "basic";
    const sort = (searchParams.get("sort") ?? "relevance") as
      | "relevance"
      | "newest"
      | "citations";
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "25", 10);
    const preset = searchParams.get("preset") ?? undefined;
    const year = searchParams.get("year") ?? undefined;
    const language = searchParams.get("language") ?? undefined;
    const docType = searchParams.get("docType") ?? undefined;
    const openAccessOnly = searchParams.get("openAccess") === "true";
    const isExport = searchParams.get("purpose") === "export";
    const apiKey = searchParams.get("apiKey") || request.headers.get("x-scopus-api-key") || undefined;
    const searchField = (searchParams.get("searchField") ?? "title") as
      | "title"
      | "all"
      | "author";

    const result = await searchScopusArticles({
      query,
      queryMode,
      sort,
      page: isNaN(page) ? 1 : page,
      pageSize: isNaN(pageSize) ? 25 : pageSize,
      preset: preset || undefined,
      year: year || undefined,
      language: language || undefined,
      docType: docType || undefined,
      openAccessOnly,
      apiKey: apiKey || undefined,
      searchField,
      allowDemo: !isExport,
      signal: request.signal,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("API /api/scopus error:", error);
    return NextResponse.json(
      {
        articles: [],
        totalResults: 0,
        page: 1,
        pageSize: 25,
        totalPages: 0,
        isDemo: true,
        error: error instanceof Error ? error.message : "Gagal memproses pencarian Scopus.",
      },
      { status: error instanceof ScopusQueryError ? 400 : 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
