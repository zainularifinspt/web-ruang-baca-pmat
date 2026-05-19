"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Role } from "@/lib/types";
import { can, roleLabels } from "@/lib/mock-data";

type RoleContextValue = {
  role: Role;
  setRole: (role: Role) => void;
  roleLabel: string;
  canAccess: typeof can;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    if (typeof window === "undefined") {
      return "admin";
    }

    const savedRole = window.localStorage.getItem("ruang-baca-role") as Role | null;
    return savedRole && savedRole in roleLabels ? savedRole : "admin";
  });

  const setRole = (nextRole: Role) => {
    setRoleState(nextRole);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ruang-baca-role", nextRole);
    }
  };

  const value = useMemo(
    () => ({ role, setRole, roleLabel: roleLabels[role], canAccess: can }),
    [role],
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
