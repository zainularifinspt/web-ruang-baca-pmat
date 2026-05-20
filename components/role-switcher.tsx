"use client";

import { ShieldCheck } from "lucide-react";
import { useRole } from "@/components/role-provider";

export function RoleSwitcher() {
  const { roleLabel } = useRole();

  return (
    <div className="flex min-w-0 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 py-1 shadow-sm sm:gap-2">
      <ShieldCheck className="hidden size-4 shrink-0 text-primary sm:block" />
      <span className="flex h-9 min-w-[132px] items-center px-1 text-sm font-semibold text-slate-800 sm:min-w-[190px]">
        {roleLabel}
      </span>
    </div>
  );
}
