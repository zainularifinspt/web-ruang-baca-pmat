import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ProfileForm } from "@/app/dashboard/profil/profile-form";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-auth-server";
import { roleLabels } from "@/lib/mock-data";
import { getUserAppRole } from "@/lib/app-roles";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/profil");
  }

  const { data: profile, error } = await createSupabaseAdminClient()
    .from("profiles")
    .select("email,full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  const metadata = user.user_metadata ?? {};
  const role = getUserAppRole(user, profile?.role) ?? "petugas";
  const fullName =
    profile?.full_name ??
    textMetadata(metadata, ["full_name", "name"]) ??
    user.email ??
    "Pengguna";
  const email = profile?.email ?? user.email ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profil"
        title="Profil Akun"
        description="Atur nama tampilan yang muncul di header dashboard dan area akun."
      />

      {error ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <AlertTitle>Profil belum dapat dimuat sepenuhnya</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      <SectionCard
        title="Nama tampilan"
        description="Perubahan nama hanya memengaruhi tampilan akun di dashboard, bukan email login."
      >
        <ProfileForm fullName={fullName} email={email} roleLabel={roleLabels[role as Role]} />
      </SectionCard>
    </div>
  );
}

function textMetadata(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  return undefined;
}
