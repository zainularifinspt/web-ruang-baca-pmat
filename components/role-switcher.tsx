"use client";

import { ShieldCheck } from "lucide-react";
import { useRole } from "@/components/role-provider";

export function RoleSwitcher() {
  const { roleLabel, userDisplayName } = useRole();

  return (
    <div className="flex min-w-0 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 py-1 shadow-sm sm:gap-2">
      <ShieldCheck className="hidden size-4 shrink-0 text-primary sm:block" />
      <span className="flex min-h-9 min-w-[132px] flex-col justify-center px-1 sm:min-w-[190px]">
        <span className="truncate text-sm font-semibold leading-5 text-slate-800">
          {userDisplayName || roleLabel}
        </span>
        <span className="truncate text-[11px] font-medium leading-4 text-slate-500">
          {roleLabel}
        </span>
      </span>
    </div>
  );
}
