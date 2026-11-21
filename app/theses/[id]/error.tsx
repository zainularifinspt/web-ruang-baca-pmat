"use client";

import { ErrorScreen } from "@/components/ui-state";

export default function ThesisDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorScreen
      title="Detail skripsi belum dapat dimuat"
      description="Data skripsi tidak berhasil dibuka. Coba muat ulang detail koleksi."
      reset={reset}
    />
  );
}
