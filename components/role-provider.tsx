"use client";

import { createContext, useContext, useMemo } from "react";
import type { Role } from "@/lib/types";
import { can, roleLabels } from "@/lib/mock-data";

type RoleContextValue = {
  role: Role;
  roleLabel: string;
  userDisplayName: string;
  userEmail: string;
  canAccess: typeof can;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({
  children,
  initialRole,
  userDisplayName,
  userEmail,
}: {
  children: React.ReactNode;
  initialRole: Role;
  userDisplayName: string;
  userEmail: string;
}) {
  const value = useMemo(
    () => ({
      role: initialRole,
      roleLabel: roleLabels[initialRole],
      userDisplayName,
      userEmail,
      canAccess: can,
    }),
    [initialRole, userDisplayName, userEmail],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return context;
}
