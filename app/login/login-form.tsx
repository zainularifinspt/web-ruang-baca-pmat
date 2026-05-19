"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { LockKeyhole, LogIn, Mail, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase-auth-client";

const authErrorMessages: Record<string, string> = {
  admin_required: "Akun ini belum memiliki akses admin.",
  staff_required: "Akun ini belum memiliki akses petugas.",
  configuration: "Konfigurasi Supabase belum lengkap.",
};

function getHomeRouteForRole(role: string | null | undefined) {
  if (role === "admin") return "/admin";
  if (role === "petugas") return "/petugas";
  return null;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const queryError = searchParams.get("error");
  const displayError = formError || (queryError ? authErrorMessages[queryError] : "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        setFormError(error?.message ?? "Login gagal. Periksa email dan password.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const homeRoute = getHomeRouteForRole(profile?.role);

      if (profileError || !homeRoute) {
        await supabase.auth.signOut();
        setFormError("Akun berhasil dikenali, tetapi belum memiliki role admin atau petugas.");
        return;
      }

      router.replace(homeRoute);
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Login gagal. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {displayError ? (
        <Alert className="border-red-200 bg-red-50 text-red-800">
          <ShieldAlert className="mb-2 size-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@kampus.ac.id"
            className="h-12 rounded-xl bg-white pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Masukkan password"
            className="h-12 rounded-xl bg-white pl-10"
            required
          />
        </div>
      </div>

      <Button type="submit" className="h-12 w-full rounded-xl" disabled={isSubmitting}>
        <LogIn />
        {isSubmitting ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}
