import { ErrorScreen } from "@/components/ui-state";

export default function NotFound() {
  return (
    <ErrorScreen
      title="Halaman tidak ditemukan"
      description="Alamat yang dibuka tidak tersedia di website Ruang Baca."
    />
  );
}
