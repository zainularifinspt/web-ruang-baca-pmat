export type JournalInfo = {
  id: string;
  title: string;
  shortName: string;
  subtitle: string;
  accreditation: string;
  accreditationBadge: string;
  sintaLevel?: number;
  pIssn?: string;
  eIssn?: string;
  publisher: string;
  frequency: string;
  description: string;
  scope: string[];
  indexing: string[];
  url: string;
  submissionUrl: string;
  currentIssueUrl?: string;
  archiveUrl?: string;
  contactEmail: string;
  themeColor: "amber" | "sky" | "emerald" | "rose";
  tag: string;
};

export const PRODI_JOURNALS: JournalInfo[] = [
  {
    id: "edumat",
    title: "EDU-MAT: Jurnal Pendidikan Matematika",
    shortName: "EDU-MAT",
    subtitle: "Jurnal Ilmiah Terakreditasi Nasional SINTA 3",
    accreditation: "Terakreditasi SINTA Peringkat 3",
    accreditationBadge: "SINTA 3",
    sintaLevel: 3,
    pIssn: "2338-2759",
    eIssn: "2597-9051",
    publisher: "Program Studi Pendidikan Matematika, FKIP Universitas Lambung Mangkurat",
    frequency: "2 Kali Setahun (April & Oktober)",
    description:
      "Jurnal ilmiah berkala yang mempublikasikan artikel hasil penelitian orisinal dan kajian konseptual komprehensif di bidang pendidikan matematika, model pembelajaran inovatif, pemecahan masalah matematis, HOTS, serta etnomatematika.",
    scope: [
      "Model, Strategi, & Pendekatan Pembelajaran Matematika",
      "Realistic Mathematics Education (RME / PMRI)",
      "Etnomatematika & Kearifan Lokal Kalimantan",
      "Kemampuan Berpikir Kritis, Kreatif, & Problem Solving",
      "Pengembangan Media Digital & Bahan Ajar Matematika",
      "Asesmen & Evaluasi Pembelajaran Matematika",
    ],
    indexing: [
      "SINTA (Kemendikbudristek)",
      "Google Scholar",
      "GARUDA",
      "Dimensions",
      "Crossref (DOI)",
      "BASE",
    ],
    url: "https://ppjp.ulm.ac.id/journal/index.php/edumat",
    submissionUrl: "https://ppjp.ulm.ac.id/journal/index.php/edumat/about/submissions",
    currentIssueUrl: "https://ppjp.ulm.ac.id/journal/index.php/edumat/issue/current",
    archiveUrl: "https://ppjp.ulm.ac.id/journal/index.php/edumat/issue/archive",
    contactEmail: "edu.mat@ulm.ac.id",
    themeColor: "amber",
    tag: "Jurnal Ilmiah Utama Prodi",
  },
  {
    id: "jurmadikta",
    title: "JURMADIKTA: Jurnal Mahasiswa Pendidikan Matematika",
    shortName: "JURMADIKTA",
    subtitle: "Wadah Publikasi Karya Ilmiah & Skripsi Mahasiswa S1",
    accreditation: "E-Journal Resmi PPJP ULM",
    accreditationBadge: "E-Journal ULM",
    pIssn: undefined,
    eIssn: "Portal PPJP ULM",
    publisher: "Program Studi Pendidikan Matematika, FKIP Universitas Lambung Mangkurat",
    frequency: "Terbit Berkala Setiap Semester",
    description:
      "Platform publikasi ilmiah yang didedikasikan untuk mendiseminasikan artikel hasil skripsi, tugas akhir, dan riset kolaboratif mahasiswa Program Studi Pendidikan Matematika FKIP ULM bersama para dosen pembimbing.",
    scope: [
      "Diseminasi Hasil Riset Skripsi Mahasiswa PMat",
      "Penelitian Tindakan Kelas (PTK) Matematika Sekolah",
      "Eksperimen & Komparasi Metode Pembelajaran",
      "Pengembangan Lembar Kerja Peserta Didik (LKPD)",
      "Analisis Kesulitan Belajar & Miskonsepsi Siswa",
    ],
    indexing: ["Google Scholar", "GARUDA", "Portal PPJP ULM"],
    url: "https://ppjp.ulm.ac.id/journals/index.php/jpm",
    submissionUrl: "https://ppjp.ulm.ac.id/journals/index.php/jpm/about/submissions",
    currentIssueUrl: "https://ppjp.ulm.ac.id/journals/index.php/jpm/issue/current",
    archiveUrl: "https://ppjp.ulm.ac.id/journals/index.php/jpm/issue/archive",
    contactEmail: "edu.mat@ulm.ac.id",
    themeColor: "sky",
    tag: "Publikasi Skripsi & Riset Mahasiswa",
  },
];
