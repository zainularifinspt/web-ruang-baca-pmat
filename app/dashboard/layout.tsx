import { DashboardRoot } from "@/components/dashboard-shell";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-auth-server";
import { hasValidSupabaseConfig } from "@/lib/supabase-config";
import { getUserAppRole } from "@/lib/app-roles";
import type { Role } from "@/lib/types";

const dashboardRoles: Role[] = ["admin", "dosen", "petugas"];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!hasValidSupabaseConfig()) {
    redirect("/login?redirectTo=/dashboard&error=configuration");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const { data: profile } = await createSupabaseAdminClient()
    .from("profiles")
    .select("role,email,full_name")
    .eq("id", user.id)
    .maybeSingle();

  const role = getUserAppRole(user, profile?.role);

  if (role === "mahasiswa") {
    redirect("/katalog");
  }

  if (!role || !dashboardRoles.includes(role)) {
    redirect("/login?redirectTo=/dashboard&error=staff_required");
  }

  const metadata = user.user_metadata ?? {};
  const userDisplayName =
    profile?.full_name ??
    (typeof metadata.full_name === "string" ? metadata.full_name : undefined) ??
    (typeof metadata.name === "string" ? metadata.name : undefined) ??
    user.email ??
    "Pengguna";
  const userEmail = profile?.email ?? user.email ?? "";

  return <DashboardRoot role={role} userDisplayName={userDisplayName} userEmail={userEmail}>{children}</DashboardRoot>;
}
