import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { hasValidSupabaseConfig } from "@/lib/supabase-config";

function redirectToLogin(request: NextRequest, error?: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);

  if (error) {
    loginUrl.searchParams.set("error", error);
  }

  return NextResponse.redirect(loginUrl);
}

function isProtectedPetugasPath(pathname: string) {
  return pathname === "/petugas" || pathname.startsWith("/petugas/");
}

function isProtectedAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isProtectedDashboardPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasValidSupabaseConfig() || !supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return redirectToLogin(request, "configuration");
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectToLogin(request);
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role;
  const pathname = request.nextUrl.pathname;

  if (error || !role) {
    return redirectToLogin(request, "staff_required");
  }

  if (isProtectedAdminPath(pathname) && role !== "admin") {
    return redirectToLogin(request, "admin_required");
  }

  if (isProtectedDashboardPath(pathname) && role !== "admin" && role !== "dosen" && role !== "petugas") {
    return redirectToLogin(request, "staff_required");
  }

  if (isProtectedPetugasPath(pathname) && role !== "admin" && role !== "petugas") {
    return redirectToLogin(request, "staff_required");
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/petugas/:path*"],
};
