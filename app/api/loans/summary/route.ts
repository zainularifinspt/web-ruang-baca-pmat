import { internalFeatures, inactiveFeatureMessage } from "@/lib/internal-features";
import { NextResponse } from "next/server";
import { requireStaffRole } from "@/lib/auth-guards";
import { fetchLoanSummary } from "@/lib/loans";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!internalFeatures.loans) {
    return NextResponse.json({ error: inactiveFeatureMessage }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const auth = await requireStaffRole(["admin", "dosen", "petugas"]);

  if (!auth.ok) {
    return NextResponse.json({ active: 0, overdue: 0 }, { status: 401 });
  }

  const summary = await fetchLoanSummary();
  return NextResponse.json(summary);
}
