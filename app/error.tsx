"use client";

import { ErrorScreen } from "@/components/ui-state";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorScreen
      title="Website belum dapat dimuat"
      description="Ada gangguan saat memuat halaman. Data aman, silakan coba lagi."
      reset={reset}
    />
  );
}
