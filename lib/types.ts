export type Role = "admin" | "dosen" | "petugas" | "mahasiswa";

export type Permission =
  | "view_dashboard"
  | "view_catalog"
  | "create_collection"
  | "verify_collection"
  | "view_attendance"
  | "manage_users"
  | "view_reports"
  | "export_data"
  | "use_whatsapp_simulation";

export type VerificationStatus = "pending" | "approved" | "rejected";

export type BookStatus = "tersedia" | "dipinjam" | "arsip";

export type VisitPurpose =
  | "Mencari buku"
  | "Mencari referensi skripsi"
  | "Membaca buku"
  | "Diskusi kelompok"
  | "Konsultasi akademik"
  | "Lainnya";

export type VisitorStatus = "Mahasiswa" | "Dosen" | "Umum";

export type ExportType = "attendance" | "book" | "thesis" | "visitor";

export type User = {
  id: string;
  name: string;
  nimNip: string;
  phoneNumber: string;
  role: Role;
  studyProgram?: string;
};

export type CollectionBase = {
  id: string;
  title: string;
  year: number;
  code: string;
  location: string;
  inputSource: "Dasbor" | "Simulasi WhatsApp" | "Impor";
  inputBy: string;
  verificationStatus: VerificationStatus;
  notes?: string;
  keywords: string[];
  createdAt: string;
};

export type Book = CollectionBase & {
  type: "book";
  author: string;
  publisher: string;
  category: string;
  rackLocation: string;
  stock: number;
  available: number;
  isbn: string;
  coverUrl?: string;
  status: BookStatus;
};

export type Thesis = CollectionBase & {
  type: "thesis";
  studentName: string;
  studentNim?: string;
  topic: string;
  supervisor1: string;
  supervisor2: string;
  abstract: string;
  coverUrl?: string;
  physicalLocation: string;
  accessNote: string;
  pdfUrl?: string;
  pdfFilename?: string;
  pdfSize?: number;
};

export type Attendance = {
  id: string;
  userId?: string;
  guestName: string;
  guestNim: string;
  visitorStatus: VisitorStatus;
  studyProgram: string;
  purpose: VisitPurpose | string;
  visitedAt: string;
  status: "Berhasil" | "Perlu Cek";
};

export type VisitorMetric = {
  label: string;
  visits: number;
  books: number;
  theses: number;
};

export type WhatsAppSubmission = {
  id: string;
  sender: string;
  message: string;
  parsedType: "Buku" | "Skripsi" | "Tidak valid";
  status: VerificationStatus;
  response: string;
  receivedAt: string;
};
