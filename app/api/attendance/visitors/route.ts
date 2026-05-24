import { NextResponse } from "next/server";
import { requireStaffRole } from "@/lib/auth-guards";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { VisitorStatus } from "@/lib/types";

type ImportVisitorRow = {
  full_name?: string;
  name?: string;
  nama?: string;
  nim_nip?: string;
  nim?: string;
  nip?: string;
  visitor_status?: string;
  status?: string;
  role?: string;
  study_program?: string;
  program_studi?: string;
};

export async function POST(request: Request) {
  const auth = await requireStaffRole(["admin"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { rows?: ImportVisitorRow[] };
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const payload = rows.map(normalizeRow).filter((row): row is NonNullable<typeof row> => Boolean(row));

    if (!payload.length) {
      return NextResponse.json({ error: "Tidak ada data presensi yang valid untuk diimport." }, { status: 400 });
    }

    const { error } = await createSupabaseAdminClient()
      .from("attendance_visitors")
      .upsert(payload, { onConflict: "nim_nip" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ imported: payload.length }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengimport data presensi." },
      { status: 500 },
    );
  }
}

function normalizeRow(row: ImportVisitorRow) {
  const nimNip = String(row.nim_nip ?? row.nim ?? row.nip ?? "").trim();
  const fullName = String(row.full_name ?? row.name ?? row.nama ?? "").trim();

  if (!nimNip || !fullName) return null;

  return {
    nim_nip: nimNip,
    full_name: fullName,
    visitor_status: normalizeVisitorStatus(row.visitor_status ?? row.status ?? row.role),
    study_program: String(row.study_program ?? row.program_studi ?? "Pendidikan Matematika").trim() || "Pendidikan Matematika",
    updated_at: new Date().toISOString(),
  };
}

function normalizeVisitorStatus(value: unknown): VisitorStatus {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (normalized === "dosen") return "Dosen";
  if (normalized === "umum") return "Umum";
  return "Mahasiswa";
}
