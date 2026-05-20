"use client";

import { ErrorScreen } from "@/components/ui-state";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorScreen
      title="Panel admin belum dapat dimuat"
      description="Ada gangguan saat memuat akses admin atau data petugas."
      reset={reset}
      withNav={false}
    />
  );
}
