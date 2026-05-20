import type { User } from "@supabase/supabase-js";
import type { Role } from "@/lib/types";

export const appRoles: Role[] = ["admin", "dosen", "petugas", "mahasiswa"];

export function isAppRole(role: unknown): role is Role {
  return appRoles.includes(role as Role);
}

export function getUserAppRole(user: Pick<User, "user_metadata">, profileRole?: unknown) {
  const metadataRole = user.user_metadata?.app_role ?? user.user_metadata?.role;

  if (isAppRole(metadataRole)) {
    return metadataRole;
  }

  if (isAppRole(profileRole)) {
    return profileRole;
  }

  return undefined;
}
