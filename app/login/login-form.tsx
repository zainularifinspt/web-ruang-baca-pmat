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
  staff_required: "Akun ini belum memiliki akses dashboard.",
  configuration: "Konfigurasi Supabase belum lengkap.",
};

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
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (result.error || !result.data.user) {
        setFormError(result.error?.message ?? "Login gagal. Periksa email dan password.");
        return;
      }

      const accessToken = result.data.session?.access_token;
      const roleResponse = await fetch("/api/auth/role", {
        method: "POST",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      const roleResult = (await roleResponse.json()) as {
        role?: "admin" | "dosen" | "petugas" | "mahasiswa";
        message?: string;
      };

      if (!roleResponse.ok || !roleResult.role) {
        await supabase.auth.signOut();
        setFormError(
          roleResult.message ?? "Akun berhasil dikenali, tetapi belum memiliki role aplikasi.",
        );
        return;
      }

      if (roleResult.role === "admin") {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      if (roleResult.role === "petugas") {
        router.replace("/petugas");
        router.refresh();
        return;
      }

      if (roleResult.role === "dosen") {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      if (roleResult.role === "mahasiswa") {
        router.replace("/katalog");
        router.refresh();
        return;
      }

      await supabase.auth.signOut();
      setFormError("Akun berhasil dikenali, tetapi belum memiliki role aplikasi.");
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
        <Alert className="flex items-start gap-3 rounded-2xl border-red-200 bg-red-50/90 px-4 py-3 text-red-800 shadow-sm">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
            <ShieldAlert className="size-4" />
          </span>
          <AlertDescription className="pt-1 font-medium leading-6">{displayError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold text-slate-700">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-emerald-600/70" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@kampus.ac.id"
            className="h-12 rounded-2xl border-slate-200 bg-white/90 pl-11 pr-4 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-cyan-300 focus-visible:ring-cyan-500/20"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold text-slate-700">
          Password
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-emerald-600/70" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Masukkan password"
            className="h-12 rounded-2xl border-slate-200 bg-white/90 pl-11 pr-4 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-cyan-300 focus-visible:ring-cyan-500/20"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-full bg-gradient-to-r from-emerald-700 via-cyan-700 to-violet-700 font-bold text-white shadow-lg shadow-emerald-950/15 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-950/20"
        disabled={isSubmitting}
      >
        <LogIn />
        {isSubmitting ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}
