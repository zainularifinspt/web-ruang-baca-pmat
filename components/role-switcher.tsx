"use client";

import { ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { roleLabels } from "@/lib/mock-data";
import type { Role } from "@/lib/types";
import { useRole } from "@/components/role-provider";

export function RoleSwitcher() {
  const { role, setRole } = useRole();

  return (
    <div className="flex min-w-0 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 py-1 shadow-sm sm:gap-2">
      <ShieldCheck className="hidden size-4 shrink-0 text-primary sm:block" />
      <Select value={role} onValueChange={(value) => setRole(value as Role)}>
        <SelectTrigger className="h-9 w-[132px] border-0 px-1 shadow-none focus:ring-0 sm:w-[190px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(roleLabels) as Role[]).map((item) => (
            <SelectItem key={item} value={item}>
              {roleLabels[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
