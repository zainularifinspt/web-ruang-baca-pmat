"use client";

import { ErrorState } from "@/components/ui-state";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      title="Dashboard belum dapat dimuat"
      description="Ada masalah saat mengambil data internal. Coba lagi tanpa keluar dari sesi login."
      reset={reset}
      homeHref="/dashboard"
    />
  );
}
