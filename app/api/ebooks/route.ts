import { NextResponse } from "next/server";
import { fetchEbooksFromApi } from "@/lib/ebooks";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/public-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { ebooks, error } = await fetchEbooksFromApi();

  if (error && (!ebooks || ebooks.length === 0)) {
    return NextResponse.json(
      { success: false, ebooks: [], error },
      { status: 500, headers: PRIVATE_NO_STORE_HEADERS },
    );
  }

  return NextResponse.json(
    {
      success: true,
      count: ebooks.length,
      ebooks,
      error,
    },
    { headers: PRIVATE_NO_STORE_HEADERS },
  );
}
