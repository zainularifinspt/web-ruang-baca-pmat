import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ruang Baca Pendidikan Matematika",
  description:
    "Prototipe antarmuka untuk katalog, presensi, laporan, dan simulasi input WhatsApp Ruang Baca.",
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
