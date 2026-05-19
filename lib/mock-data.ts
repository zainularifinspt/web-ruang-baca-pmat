import type {
  Attendance,
  Book,
  Permission,
  Role,
  Thesis,
  User,
  VerificationStatus,
  VisitorMetric,
  VisitorStatus,
  VisitPurpose,
  WhatsAppSubmission,
} from "@/lib/types";

export const roleLabels: Record<Role, string> = {
  admin: "Admin Prodi",
  dosen: "Dosen",
  petugas: "Petugas Ruang Baca",
  mahasiswa: "Mahasiswa",
};

export const verificationTone: Record<VerificationStatus, string> = {
  "Menunggu Verifikasi": "bg-amber-100 text-amber-800 border-amber-200",
  Disetujui: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Perlu Revisi": "bg-sky-100 text-sky-800 border-sky-200",
  Ditolak: "bg-rose-100 text-rose-800 border-rose-200",
};

export const visitPurposes: VisitPurpose[] = [
  "Mencari buku",
  "Membaca buku",
  "Mencari referensi skripsi",
  "Diskusi kelompok",
  "Konsultasi akademik",
  "Lainnya",
];

export const visitorStatuses: VisitorStatus[] = ["Mahasiswa", "Dosen", "Umum"];

export const permissionLabels: Record<Permission, string> = {
  view_dashboard: "Melihat dashboard",
  view_catalog: "Melihat katalog",
  create_collection: "Input buku/skripsi",
  verify_collection: "Verifikasi koleksi",
  view_attendance: "Melihat presensi",
  manage_users: "Kelola pengguna",
  view_reports: "Melihat laporan",
  export_data: "Ekspor data",
  use_whatsapp_simulation: "Simulasi input WhatsApp",
};

export const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    "view_dashboard",
    "view_catalog",
    "create_collection",
    "verify_collection",
    "view_attendance",
    "manage_users",
    "view_reports",
    "export_data",
    "use_whatsapp_simulation",
  ],
  dosen: [
    "view_dashboard",
    "view_catalog",
    "create_collection",
    "view_attendance",
    "view_reports",
    "export_data",
  ],
  petugas: [
    "view_dashboard",
    "view_catalog",
    "create_collection",
    "view_attendance",
    "use_whatsapp_simulation",
  ],
  mahasiswa: ["view_catalog"],
};

export const users: User[] = [
  {
    id: "u-admin",
    name: "Dr. Nurul Hidayah",
    nimNip: "198705142019032008",
    phoneNumber: "+6281210001001",
    role: "admin",
  },
  {
    id: "u-dosen",
    name: "Muh. Farid, M.Pd.",
    nimNip: "199104022020121005",
    phoneNumber: "+6281210001002",
    role: "dosen",
  },
  {
    id: "u-petugas",
    name: "Siti Rahma",
    nimNip: "2211040012",
    phoneNumber: "+6281210001003",
    role: "petugas",
    studyProgram: "Pendidikan Matematika",
  },
  {
    id: "u-mahasiswa",
    name: "Andi Pratama",
    nimNip: "2311040007",
    phoneNumber: "+6281210001004",
    role: "mahasiswa",
    studyProgram: "Pendidikan Matematika",
  },
];

export const books: Book[] = [
  {
    id: "b-001",
    type: "book",
    title: "Kalkulus Dasar untuk Pendidikan Matematika",
    author: "James Stewart",
    publisher: "Salemba Teknika",
    category: "Kalkulus",
    year: 2021,
    stock: 7,
    available: 5,
    isbn: "978-602-1234-11-7",
    code: "BK-KAL-001",
    location: "Rak A1",
    rackLocation: "Rak A1",
    inputSource: "Dasbor",
    inputBy: "Siti Rahma",
    verificationStatus: "Disetujui",
    keywords: ["kalkulus", "limit", "turunan", "integral"],
    createdAt: "2026-05-01T09:12:00+08:00",
  },
  {
    id: "b-002",
    type: "book",
    title: "Statistika Pendidikan",
    author: "Sugiyono",
    publisher: "Alfabeta",
    category: "Statistika",
    year: 2020,
    stock: 4,
    available: 2,
    isbn: "978-602-289-034-5",
    code: "BK-STA-014",
    location: "Rak B2",
    rackLocation: "Rak B2",
    inputSource: "Simulasi WhatsApp",
    inputBy: "Muh. Farid",
    verificationStatus: "Menunggu Verifikasi",
    keywords: ["statistika", "penelitian", "data"],
    createdAt: "2026-05-17T14:05:00+08:00",
  },
  {
    id: "b-003",
    type: "book",
    title: "Geometri Analitik Bidang dan Ruang",
    author: "Ruseffendi",
    publisher: "Tarsito",
    category: "Geometri",
    year: 2019,
    stock: 3,
    available: 3,
    isbn: "978-979-3320-22-1",
    code: "BK-GEO-008",
    location: "Rak C1",
    rackLocation: "Rak C1",
    inputSource: "Dasbor",
    inputBy: "Admin Prodi",
    verificationStatus: "Perlu Revisi",
    notes: "Lengkapi nomor ISBN pada data fisik.",
    keywords: ["geometri", "vektor", "ruang"],
    createdAt: "2026-05-12T11:45:00+08:00",
  },
];

export const theses: Thesis[] = [
  {
    id: "s-001",
    type: "thesis",
    title: "Analisis Kemampuan Berpikir Kritis Siswa pada Materi Sistem Persamaan Linear",
    studentName: "Nur Aisyah",
    topic: "berpikir kritis",
    supervisor1: "Dr. Ahmad Fauzi, M.Pd.",
    supervisor2: "Dr. Siti Rahmah, M.Si.",
    abstract:
      "Penelitian ini mendeskripsikan kemampuan berpikir kritis siswa kelas VIII dalam menyelesaikan soal sistem persamaan linear dua variabel.",
    year: 2024,
    code: "SKR-2024-017",
    location: "Lemari Skripsi 2",
    physicalLocation: "Lemari Skripsi 2",
    accessNote:
      "Dokumen lengkap tersedia dalam bentuk fisik di Ruang Baca Program Studi Pendidikan Matematika.",
    inputSource: "Dasbor",
    inputBy: "Admin Prodi",
    verificationStatus: "Disetujui",
    keywords: ["berpikir kritis", "spldv", "analisis"],
    createdAt: "2026-04-28T10:20:00+08:00",
  },
  {
    id: "s-002",
    type: "thesis",
    title: "Pengembangan LKPD Berbasis Etnomatematika pada Materi Transformasi Geometri",
    studentName: "Fajri Ramadhan",
    topic: "etnomatematika",
    supervisor1: "Muh. Farid, M.Pd.",
    supervisor2: "Dr. Nurul Hidayah, M.Pd.",
    abstract:
      "Produk LKPD dikembangkan untuk membantu siswa mengaitkan konsep transformasi geometri dengan konteks budaya lokal.",
    year: 2023,
    code: "SKR-2023-042",
    location: "Lemari Skripsi 1",
    physicalLocation: "Lemari Skripsi 1",
    accessNote:
      "Dokumen lengkap tersedia dalam bentuk fisik di Ruang Baca Program Studi Pendidikan Matematika.",
    inputSource: "Simulasi WhatsApp",
    inputBy: "Siti Rahma",
    verificationStatus: "Menunggu Verifikasi",
    keywords: ["lkpd", "etnomatematika", "transformasi"],
    createdAt: "2026-05-15T16:10:00+08:00",
  },
  {
    id: "s-003",
    type: "thesis",
    title: "Efektivitas Model Problem Based Learning terhadap Literasi Numerasi",
    studentName: "Maya Lestari",
    topic: "literasi numerasi",
    supervisor1: "Dr. Andi Kurniawan, M.Si.",
    supervisor2: "Dr. Rina Marlina, M.Pd.",
    abstract:
      "Studi kuasi eksperimen ini menguji pengaruh problem based learning terhadap capaian literasi numerasi siswa SMP.",
    year: 2022,
    code: "SKR-2022-031",
    location: "Lemari Skripsi 3",
    physicalLocation: "Lemari Skripsi 3",
    accessNote:
      "Dokumen lengkap tersedia dalam bentuk fisik di Ruang Baca Program Studi Pendidikan Matematika.",
    inputSource: "Impor",
    inputBy: "Petugas Lama",
    verificationStatus: "Ditolak",
    notes: "Data duplikat dengan SKR-2022-019.",
    keywords: ["pbl", "literasi numerasi", "eksperimen"],
    createdAt: "2026-05-08T08:35:00+08:00",
  },
];

export const attendances: Attendance[] = [
  {
    id: "a-001",
    userId: "u-mahasiswa",
    guestName: "Andi Pratama",
    guestNim: "2311040007",
    visitorStatus: "Mahasiswa",
    studyProgram: "Pendidikan Matematika",
    purpose: "Mencari referensi skripsi",
    visitedAt: "2026-05-18T09:03:00+08:00",
    status: "Berhasil",
  },
  {
    id: "a-002",
    guestName: "Mutmainnah",
    guestNim: "2211040056",
    visitorStatus: "Mahasiswa",
    studyProgram: "Pendidikan Matematika",
    purpose: "Membaca buku",
    visitedAt: "2026-05-18T10:18:00+08:00",
    status: "Berhasil",
  },
  {
    id: "a-003",
    guestName: "Rizal Akbar",
    guestNim: "2011040011",
    visitorStatus: "Mahasiswa",
    studyProgram: "Pendidikan Matematika",
    purpose: "Diskusi kelompok",
    visitedAt: "2026-05-17T13:42:00+08:00",
    status: "Berhasil",
  },
  {
    id: "a-004",
    userId: "u-dosen",
    guestName: "Muh. Farid, M.Pd.",
    guestNim: "199104022020121005",
    visitorStatus: "Dosen",
    studyProgram: "Pendidikan Matematika",
    purpose: "Konsultasi akademik",
    visitedAt: "2026-05-16T11:15:00+08:00",
    status: "Berhasil",
  },
  {
    id: "a-005",
    guestName: "Nurul Afifah",
    guestNim: "UMUM-004",
    visitorStatus: "Umum",
    studyProgram: "Alumni Pendidikan Matematika",
    purpose: "Mencari buku",
    visitedAt: "2026-05-15T15:08:00+08:00",
    status: "Berhasil",
  },
];

export const visitorMetrics: VisitorMetric[] = [
  { label: "Sen", visits: 18, books: 7, theses: 11 },
  { label: "Sel", visits: 24, books: 10, theses: 14 },
  { label: "Rab", visits: 19, books: 8, theses: 9 },
  { label: "Kam", visits: 32, books: 15, theses: 17 },
  { label: "Jum", visits: 27, books: 9, theses: 18 },
  { label: "Sab", visits: 12, books: 6, theses: 6 },
];

export const whatsappSubmissions: WhatsAppSubmission[] = [
  {
    id: "wa-001",
    sender: "Siti Rahma",
    message: "Buku#Statistika Pendidikan#Sugiyono#2020#4",
    parsedType: "Buku",
    status: "Menunggu Verifikasi",
    response:
      "Simulasi berhasil: Buku Statistika Pendidikan masuk antrean verifikasi.",
    receivedAt: "2026-05-17T14:05:00+08:00",
  },
  {
    id: "wa-002",
    sender: "Siti Rahma",
    message:
      "Skripsi#Pengembangan LKPD Berbasis Etnomatematika#Fajri Ramadhan#2023",
    parsedType: "Skripsi",
    status: "Menunggu Verifikasi",
    response:
      "Simulasi berhasil: Skripsi Fajri Ramadhan masuk antrean verifikasi.",
    receivedAt: "2026-05-15T16:10:00+08:00",
  },
];

export function findStudentByNim(nim: string) {
  return users.find((user) => user.role === "mahasiswa" && user.nimNip === nim);
}

export function findUserByNimNip(identifier: string) {
  return users.find((user) => user.nimNip === identifier);
}

export function getVisitorStatusFromRole(role: Role): VisitorStatus {
  if (role === "mahasiswa") {
    return "Mahasiswa";
  }

  if (role === "dosen" || role === "admin") {
    return "Dosen";
  }

  return "Umum";
}

export function allCollections() {
  return [...books, ...theses].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function can(role: Role, permission: Permission) {
  return rolePermissions[role].includes(permission);
}
