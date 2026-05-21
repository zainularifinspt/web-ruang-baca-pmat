"use client";

import { ShieldCheck } from "lucide-react";
import { useRole } from "@/components/role-provider";

export function RoleSwitcher() {
  const { roleLabel, userDisplayName } = useRole();

  return (
    <div className="flex min-w-0 items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-2 py-1 shadow-sm backdrop-blur sm:gap-2">
      <span className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 sm:flex">
        <ShieldCheck className="size-4" />
      </span>
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
