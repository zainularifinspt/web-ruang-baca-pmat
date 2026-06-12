import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SectionCard } from "@/components/section-card";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { requireStaffRole } from "@/lib/auth-guards";
import { getUserAppRole } from "@/lib/app-roles";
import type { Role } from "@/lib/types";
import { UsersManagement, UsersPageActions, type ManagedUser } from "@/app/dashboard/pengguna/users-management";

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
      <UsersHeader />
      <UsersPageActions users={users} />

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

function UsersHeader() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-red-800 via-rose-700 to-yellow-800 p-5 text-white shadow-xl shadow-red-950/20 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
      <div className="relative max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-red-50 shadow-sm ring-1 ring-white/25 backdrop-blur">
          <Sparkles className="size-3.5" />
          Admin Prodi
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-normal sm:text-4xl">
          Manajemen Peran dan Pengguna
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-red-50">
          Tambah akun, ubah role, hapus pengguna, dan reset password pengguna langsung dari dashboard admin.
        </p>
      </div>
    </section>
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
