import { NextResponse } from "next/server";
import { getUserAppRole } from "@/lib/app-roles";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Role, VisitorStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const identifier = url.searchParams.get("identifier")?.trim();

  if (!identifier || identifier.length < 4) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const user = data.users.find((authUser) => {
      const metadata = authUser.user_metadata ?? {};
      return textMetadata(metadata, ["nim_nip", "nimNip", "nim", "nip"]) === identifier;
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const metadata = user.user_metadata ?? {};
    const role = getUserAppRole(user, undefined) ?? "mahasiswa";

    return NextResponse.json({
      user: {
        name: textMetadata(metadata, ["full_name", "name"]) || user.email || "",
        nimNip: identifier,
        role,
        visitorStatus: getVisitorStatus(role),
        studyProgram: textMetadata(metadata, ["study_program", "studyProgram"]) || "Pendidikan Matematika",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mencari pengguna." },
      { status: 500 },
    );
  }
}

function textMetadata(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

function getVisitorStatus(role: Role): VisitorStatus {
  if (role === "mahasiswa") return "Mahasiswa";
  if (role === "dosen") return "Dosen";
  return "Umum";
}

