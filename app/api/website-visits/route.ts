import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS, PUBLIC_SHORT_CACHE_HEADERS } from "@/lib/public-cache";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { hasValidSupabaseConfig } from "@/lib/supabase-config";

export const dynamic = "force-dynamic";

const MAKASSAR_TIME_ZONE = "Asia/Makassar";

type VisitPayload = {
  visitorId?: unknown;
  pagePath?: unknown;
};

export async function GET() {
  const result = await fetchTodayWebsiteVisitCount();

  if (result.error) {
    return NextResponse.json(
      { count: result.count, error: result.error },
      { status: 500, headers: PRIVATE_NO_STORE_HEADERS },
    );
  }

  return NextResponse.json(
    { count: result.count },
    { status: 200, headers: PUBLIC_SHORT_CACHE_HEADERS },
  );
}

export async function POST(request: Request) {
  if (!hasValidSupabaseConfig()) {
    return NextResponse.json({ count: 0 }, { status: 200, headers: PRIVATE_NO_STORE_HEADERS });
  }

  try {
    const body = (await request.json()) as VisitPayload;
    const visitorId = typeof body.visitorId === "string" ? body.visitorId.trim() : "";
    const pagePath = normalizePath(typeof body.pagePath === "string" ? body.pagePath : "/");

    if (!visitorId) {
      return NextResponse.json(
        { error: "visitorId is required" },
        { status: 400, headers: PRIVATE_NO_STORE_HEADERS },
      );
    }

    const today = getMakassarDateKey();
    const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("website_visits").upsert(
      {
        visitor_id: visitorId,
        visit_date: today,
        page_path: pagePath,
        user_agent: userAgent,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "visitor_id,visit_date" },
    );

    if (error) {
      return NextResponse.json(
        { count: 0, error: error.message },
        { status: 500, headers: PRIVATE_NO_STORE_HEADERS },
      );
    }

    const result = await fetchTodayWebsiteVisitCount();

    if (result.error) {
      return NextResponse.json(
        { count: result.count, error: result.error },
        { status: 500, headers: PRIVATE_NO_STORE_HEADERS },
      );
    }

    return NextResponse.json(
      { count: result.count },
      { status: 201, headers: PRIVATE_NO_STORE_HEADERS },
    );
  } catch (err) {
    return NextResponse.json(
      { count: 0, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500, headers: PRIVATE_NO_STORE_HEADERS },
    );
  }
}

async function fetchTodayWebsiteVisitCount() {
  if (!hasValidSupabaseConfig()) return { count: 0, error: undefined };

  try {
    const { count, error } = await createSupabaseAdminClient()
      .from("website_visits")
      .select("id", { count: "exact", head: true })
      .eq("visit_date", getMakassarDateKey());

    if (error) return { count: 0, error: error.message };

    return { count: count ?? 0, error: undefined };
  } catch (err) {
    return {
      count: 0,
      error: err instanceof Error ? err.message : "Failed to fetch website visit count",
    };
  }
}

function getMakassarDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MAKASSAR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizePath(value: string) {
  if (!value.startsWith("/")) return "/";

  return value.slice(0, 200);
}
