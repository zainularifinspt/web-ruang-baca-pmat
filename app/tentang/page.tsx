import { PublicNav } from "@/components/public-nav";
import { BookOpen, MapPin, Mail, Clock3, Users, Building2 } from "lucide-react";

export const metadata = {
  title: "Tentang Ruang Baca | Jurusan Pendidikan Matematika ULM",
  description: "Informasi tentang Ruang Baca Jurusan Pendidikan Matematika Universitas Lambung Mangkurat.",
};

export default function TentangPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-white/70 bg-white/50 p-8 shadow-sm ring-1 ring-slate-200/50 backdrop-blur-xl sm:p-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 via-yellow-600 to-orange-600 text-white shadow-lg shadow-red-900/20 mb-6">
            <BookOpen className="size-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl text-center mb-4">
            Tentang Ruang Baca PMat
          </h1>
          <p className="text-center text-slate-500 max-w-2xl mx-auto mb-12">
            Ruang Baca Jurusan Pendidikan Matematika Universitas Lambung Mangkurat merupakan fasilitas referensi akademik yang dirancang untuk membantu mahasiswa dan dosen dalam menemukan literatur.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                <MapPin className="size-5 text-red-600" /> Lokasi
              </h3>
              <p className="text-sm leading-6 text-slate-600">
                Gedung Utama FKIP ULM<br />
                Jl. Brigjen H. Hasan Basry Kayu Tangi<br />
                Banjarmasin, Kalimantan Selatan 70123
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                <Clock3 className="size-5 text-yellow-600" /> Jam Operasional
              </h3>
              <ul className="space-y-2 text-sm leading-6 text-slate-600">
                <li className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="font-medium">Senin - Kamis</span>
                  <span>08.00 - 16.00 WITA</span>
                </li>
                <li className="flex justify-between pt-1">
                  <span className="font-medium">Jumat</span>
                  <span>08.00 - 15.00 WITA</span>
                </li>
                <li className="flex justify-between pt-2">
                  <span className="font-medium">Istirahat</span>
                  <span>12.00 - 13.00 WITA</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                <Mail className="size-5 text-sky-600" /> Kontak
              </h3>
              <p className="text-sm leading-6 text-slate-600">
                Email: edu.mat@ulm.ac.id<br />
                Hubungi petugas yang sedang berjaga untuk informasi pendaftaran peminjaman dan akses repositori tertutup.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                <Users className="size-5 text-emerald-600" /> Layanan
              </h3>
              <ul className="list-inside list-disc space-y-1 text-sm leading-6 text-slate-600">
                <li>Peminjaman buku referensi</li>
                <li>Akses repositori skripsi digital</li>
                <li>Ruang baca dan diskusi ringan</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 rounded-2xl bg-slate-50 p-6 text-center border border-slate-100">
             <Building2 className="mx-auto size-8 text-slate-400 mb-3" />
             <p className="text-sm text-slate-500 font-medium">
               Website dikembangkan secara khusus untuk mendukung ekosistem digital<br className="hidden sm:block" />
               Jurusan Pendidikan Matematika FKIP ULM.
             </p>
          </div>
        </div>
      </main>
    </div>
  );
}
