import { NextResponse } from "next/server";
import { fetchCatalogData } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const visibility =
    url.searchParams.get("visibility") === "public" ? "public" : "internal";
  const { books, theses, error } = await fetchCatalogData({ visibility });

  if (error) {
    return NextResponse.json({ books, theses, error }, { status: 200 });
  }

  return NextResponse.json({ books, theses }, { status: 200 });
}
