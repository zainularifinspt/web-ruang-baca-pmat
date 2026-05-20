"use client";

import { createContext, useContext, useMemo } from "react";
import type { Role } from "@/lib/types";
import { can, roleLabels } from "@/lib/mock-data";

type RoleContextValue = {
  role: Role;
  roleLabel: string;
  canAccess: typeof can;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({
  children,
  initialRole,
}: {
  children: React.ReactNode;
  initialRole: Role;
}) {
  const value = useMemo(
    () => ({ role: initialRole, roleLabel: roleLabels[initialRole], canAccess: can }),
    [initialRole],
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
