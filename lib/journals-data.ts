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
  doi?: string;
  editorInChief?: string;
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
    accreditation: "Terakreditasi Nasional SINTA 3 (Vol. 12 No. 1 2024 s.d. Vol. 16 No. 2 2028)",
    accreditationBadge: "SINTA 3",
    sintaLevel: 3,
    pIssn: "2338-2759",
    eIssn: "2597-9051",
    doi: "10.20527",
    editorInChief: "Prof. Dr. Chairil Faif Pasani, M.Si.",
    publisher: "Program Studi Pendidikan Matematika, FKIP Universitas Lambung Mangkurat",
    frequency: "2 Kali Setahun (April & Oktober)",
    description:
      "Jurnal ilmiah yang diterbitkan sejak tahun 2013 oleh Program Studi Pendidikan Matematika FKIP Universitas Lambung Mangkurat. Memuat artikel hasil penelitian dan kajian dosen, peneliti, guru, serta mahasiswa dalam lingkup pendidikan matematika yang belum pernah dipublikasikan di tempat lain.",
    scope: [
      "Model Pembelajaran Matematika (Mathematics Learning Models)",
      "Media & Teknologi Pembelajaran Matematika",
      "Proses Berpikir Matematis (Mathematical Thinking Processes)",
      "Asesmen & Evaluasi Pembelajaran Matematika",
      "Kurikulum Pembelajaran Matematika",
      "Pengembangan Profesional Guru Matematika",
      "Etnomatematika dalam Pembelajaran Matematika",
    ],
    indexing: [
      "SINTA (Kemendikbudristek)",
      "Google Scholar",
      "GARUDA",
      "Crossref (DOI)",
      "BASE",
      "ONE Search",
      "Dimensions",
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
    subtitle: "Jurnal Mahasiswa Terakreditasi Nasional SINTA 3",
    accreditation: "Terakreditasi SINTA Peringkat 3",
    accreditationBadge: "SINTA 3",
    sintaLevel: 3,
    pIssn: "2797-829X",
    eIssn: "2797-8435",
    doi: "10.20527",
    editorInChief: "Dr. Hj. Noor Fajriah, M.Si.",
    publisher: "Program Studi Pendidikan Matematika, FKIP Universitas Lambung Mangkurat",
    frequency: "3 Kali Setahun (Maret, Juli & November)",
    description:
      "Jurnal Mahasiswa Pendidikan Matematika yang didirikan sejak tahun 2018 di Program Studi Pendidikan Matematika FKIP ULM. Merupakan wadah publikasi artikel ilmiah hasil riset skripsi mahasiswa S1 di bidang pendidikan matematika yang belum pernah dipublikasikan di media lain.",
    scope: [
      "Diseminasi Hasil Riset Skripsi Mahasiswa PMat",
      "Penelitian Tindakan Kelas (PTK) Matematika Sekolah",
      "Eksperimen & Komparasi Metode Pembelajaran",
      "Pengembangan Media Pembelajaran & LKPD Matematika",
      "Analisis Kesulitan Belajar, Pemecahan Masalah, & Miskonsepsi",
    ],
    indexing: [
      "SINTA (Kemendikbudristek)",
      "Google Scholar",
      "GARUDA",
      "Crossref (DOI)",
      "Portal JTAM / PPJP ULM",
    ],
    url: "https://jtam.ulm.ac.id/index.php/jurmadikta",
    submissionUrl: "https://jtam.ulm.ac.id/index.php/jurmadikta/about/submissions",
    currentIssueUrl: "https://jtam.ulm.ac.id/index.php/jurmadikta/issue/current",
    archiveUrl: "https://jtam.ulm.ac.id/index.php/jurmadikta/issue/archive",
    contactEmail: "jurmadikta@ulm.ac.id",
    themeColor: "sky",
    tag: "Publikasi Skripsi & Riset Mahasiswa",
  },
];
