import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { WebsiteVisitTracker } from "@/components/website-visit-tracker";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
});

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
    <html lang="id" className={plusJakartaSans.className}>
      <body>
        <WebsiteVisitTracker />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
