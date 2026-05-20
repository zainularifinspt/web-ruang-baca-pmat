"use client";

import { ErrorScreen } from "@/components/ui-state";

export default function BookDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorScreen
      title="Detail buku belum dapat dimuat"
      description="Data buku tidak berhasil dibuka. Coba muat ulang detail koleksi."
      reset={reset}
    />
  );
}
