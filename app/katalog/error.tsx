"use client";

import { ErrorScreen } from "@/components/ui-state";

export default function CatalogError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorScreen
      title="Katalog belum dapat dimuat"
      description="Data buku dan skripsi belum berhasil diambil. Coba muat ulang katalog."
      reset={reset}
    />
  );
}
