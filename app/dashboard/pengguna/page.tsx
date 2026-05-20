import { redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { requireStaffRole } from "@/lib/auth-guards";
import { getUserAppRole } from "@/lib/app-roles";
import type { Role } from "@/lib/types";
import { AddUserButton, UsersManagement, type ManagedUser } from "@/app/dashboard/pengguna/users-management";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role | null;
};

export default async function UsersPage() {
  const auth = await requireStaffRole(["admin"]);

  if (!auth.ok) {
    redirect("/login?redirectTo=/dashboard/pengguna&error=admin_required");
  }

  const { users, error } = await fetchManagedUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pengguna"
        title="Manajemen Peran dan Pengguna"
        description="Tambah akun, ubah role, hapus pengguna, dan reset password pengguna langsung dari dashboard admin."
        action={<AddUserButton />}
      />

      {error ? (
        <Alert className="border-red-200 bg-red-50 text-red-800">
          <AlertTitle>Daftar pengguna belum dapat dimuat</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <SectionCard
        title="Daftar pengguna"
        description="Role aplikasi dan tombol reset password pengguna tersedia untuk setiap akun non-admin."
      >
        <UsersManagement users={users} />
      </SectionCard>
    </div>
  );
}

async function fetchManagedUsers() {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const [{ data: profiles, error: profilesError }, { data: authUsers, error: authUsersError }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("id,email,full_name,role"),
        supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ]);

    if (profilesError) {
      return { users: [] as ManagedUser[], error: profilesError.message };
    }

    if (authUsersError) {
      return { users: [] as ManagedUser[], error: authUsersError.message };
    }

    const authUserById = new Map(authUsers.users.map((user) => [user.id, user]));
    const users = ((profiles ?? []) as ProfileRow[])
      .map((profile) => {
        const authUser = authUserById.get(profile.id);
        const metadata = authUser?.user_metadata ?? {};
        const role = authUser ? getUserAppRole(authUser, profile.role) : profile.role;

        if (!role) return null;

        return {
          id: profile.id,
          email: profile.email ?? authUser?.email ?? "",
          fullName: profile.full_name ?? metadata.full_name ?? metadata.name ?? "",
          nimNip: textMetadata(metadata, ["nim_nip", "nimNip", "nim", "nip"]),
          phoneNumber: textMetadata(metadata, ["phone_number", "phoneNumber", "whatsapp", "phone"]),
          role,
        };
      })
      .filter((user): user is ManagedUser => Boolean(user));

    return { users, error: undefined };
  } catch (error) {
    return {
      users: [] as ManagedUser[],
      error: error instanceof Error ? error.message : "Gagal memuat pengguna.",
    };
  }
}

function textMetadata(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}
