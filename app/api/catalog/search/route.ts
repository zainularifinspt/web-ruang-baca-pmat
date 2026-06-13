import { NextResponse } from "next/server";
import { buildCatalogSearchItems } from "@/lib/catalog-search";
import { fetchCatalogData } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { books, theses, error } = await fetchCatalogData({ visibility: "public" });

  if (error) {
    return NextResponse.json({ items: [], error }, { status: 200 });
  }

  const items = buildCatalogSearchItems({ books, theses });

  return NextResponse.json({ items });
}
