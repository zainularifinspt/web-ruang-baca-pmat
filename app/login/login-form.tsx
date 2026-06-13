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
  configuration: "Konfigurasi sistem belum lengkap.",
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
        <Alert className="flex items-start gap-3.5 rounded-2xl border-red-500/20 bg-red-500/10 px-4 py-3.5 text-red-900 shadow-xs backdrop-blur-md">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-700 border border-red-500/20">
            <ShieldAlert className="size-4" />
          </span>
          <AlertDescription className="pt-1 text-xs font-semibold leading-relaxed text-red-950">
            {displayError}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">
          Alamat Email
        </label>
        <div className="relative group">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-yellow-600/70 transition-colors group-focus-within:text-yellow-600" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@kampus.ac.id"
            className="h-12 rounded-2xl border-slate-200/80 bg-white/50 pl-11 pr-4 text-slate-900 shadow-xs transition-all duration-300 placeholder:text-slate-400 focus-visible:border-yellow-400 focus-visible:ring-4 focus-visible:ring-yellow-500/10 focus-visible:bg-white backdrop-blur-xs"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">
          Kata Sandi
        </label>
        <div className="relative group">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-yellow-600/70 transition-colors group-focus-within:text-yellow-600" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Masukkan kata sandi Anda"
            className="h-12 rounded-2xl border-slate-200/80 bg-white/50 pl-11 pr-4 text-slate-900 shadow-xs transition-all duration-300 placeholder:text-slate-400 focus-visible:border-yellow-400 focus-visible:ring-4 focus-visible:ring-yellow-500/10 focus-visible:bg-white backdrop-blur-xs"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-full bg-gradient-to-r from-red-600 via-yellow-600 to-orange-600 font-bold text-white shadow-lg shadow-yellow-950/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-yellow-500/20 active:scale-[0.98] group"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Memproses...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <LogIn className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            <span>Masuk ke Dashboard</span>
          </span>
        )}
      </Button>
    </form>
  );
}
