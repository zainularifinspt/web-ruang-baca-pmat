import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ruang Baca Jurusan Pendidikan Matematika ULM",
  description:
    "Portal katalog, presensi, dan ruang baca Jurusan Pendidikan Matematika Universitas Lambung Mangkurat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
