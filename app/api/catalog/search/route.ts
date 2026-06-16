import { NextResponse } from "next/server";
import { fetchPublicSearchItems, PUBLIC_CACHE_HEADERS } from "@/lib/public-cache";

export const revalidate = 300;

export async function GET() {
  const { items, error } = await fetchPublicSearchItems();

  if (error) {
    return NextResponse.json(
      { items: [], error },
      { status: 200, headers: PUBLIC_CACHE_HEADERS },
    );
  }

  return NextResponse.json({ items }, { headers: PUBLIC_CACHE_HEADERS });
}
