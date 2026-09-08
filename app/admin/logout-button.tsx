"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase-auth-client";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "rounded-lg border-slate-200 bg-white font-medium text-slate-800 shadow-2xs hover:bg-slate-50 hover:text-red-700",
        className,
      )}
      onClick={handleLogout}
      disabled={isSigningOut}
    >
      <LogOut />
      {isSigningOut ? "Keluar..." : "Keluar"}
    </Button>
  );
}
