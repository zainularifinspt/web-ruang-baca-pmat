import { NextResponse } from "next/server";
import { fetchEbooksFromApi } from "@/lib/ebooks";
import { PUBLIC_CACHE_HEADERS } from "@/lib/public-cache";

export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceFresh = searchParams.get("fresh") === "true";
  const { ebooks, error } = await fetchEbooksFromApi({ forceFresh });

  if (error && (!ebooks || ebooks.length === 0)) {
    return NextResponse.json(
      { success: false, ebooks: [], error },
      { status: 500, headers: PUBLIC_CACHE_HEADERS },
    );
  }

  return NextResponse.json(
    {
      success: true,
      count: ebooks.length,
      ebooks,
      error,
    },
    { headers: PUBLIC_CACHE_HEADERS },
  );
}
