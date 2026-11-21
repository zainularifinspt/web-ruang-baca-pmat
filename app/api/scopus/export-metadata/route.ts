import { NextRequest, NextResponse } from "next/server";
import { fetchScopusMetadata } from "@/lib/scopus-metadata";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !Array.isArray(body.eids) || body.eids.length === 0 || body.eids.length > 5 || body.eids.some((eid: unknown) => typeof eid !== "string" || !/^2-s2\.0-\d+$/.test(eid))) {
      return NextResponse.json({ error: "Pilih 1–5 identitas artikel Scopus yang valid per permintaan." }, { status: 400 });
    }
    const eids = [...new Set<string>(body.eids)];
    const results = await Promise.all(eids.map(async (eid) => ({ eid, ...await fetchScopusMetadata(eid, request.signal) })));
    return NextResponse.json({
      updates: Object.fromEntries(results.filter((result) => result.article).map((result) => [result.eid, result.article])),
      unavailable: results.some((result) => result.unavailable),
      warnings: [...new Set(results.flatMap((result) => result.warning ? [result.warning] : []))],
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal mengambil metadata tambahan." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
