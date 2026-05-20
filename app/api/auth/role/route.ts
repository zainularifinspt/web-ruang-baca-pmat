import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getSupabaseConfig } from "@/lib/supabase-config";
import type { Role } from "@/lib/types";

const appRoles: Role[] = ["admin", "dosen", "petugas", "mahasiswa"];

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.match(/^Bearer (.+)$/i)?.[1];

    if (!accessToken) {
      return NextResponse.json({ message: "Token login tidak ditemukan." }, { status: 401 });
    }

    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ message: "Sesi login tidak valid." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await createSupabaseAdminClient()
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role;

    if (profileError || !isAppRole(role)) {
      return NextResponse.json(
        { message: "Akun berhasil dikenali, tetapi belum memiliki role aplikasi." },
        { status: 403 },
      );
    }

    return NextResponse.json({ role });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Role akun belum dapat diperiksa." },
      { status: 500 },
    );
  }
}

function isAppRole(role: unknown): role is Role {
  return appRoles.includes(role as Role);
}
