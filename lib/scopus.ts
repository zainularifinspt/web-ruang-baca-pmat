export type ScopusArticle = {
  id: string;
  eid: string;
  title: string;
  authors: string;
  journal: string;
  coverDate: string;
  year: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  doiUrl?: string;
  scopusUrl?: string;
  citedByCount: number;
  affiliations: string[];
  aggregationType: string;
  subtypeDescription: string;
  openAccess?: boolean;
};

export type ScopusSearchOptions = {
  query: string;
  sort?: "relevance" | "newest" | "citations";
  page?: number;
  pageSize?: number;
  preset?: string;
  year?: string;
  language?: string;
  docType?: string;
  openAccessOnly?: boolean;
  apiKey?: string;
};

export type ScopusSearchResponse = {
  articles: ScopusArticle[];
  totalResults: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isDemo: boolean;
  message?: string;
};

/**
 * Normalizes user query into Scopus API search syntax with advanced filters
 */
export function formatScopusQuery(options: {
  rawQuery: string;
  preset?: string;
  year?: string;
  language?: string;
  docType?: string;
  openAccessOnly?: boolean;
}): string {
  let baseQuery = "";
  const trimmed = options.rawQuery.trim();

  // If preset is selected and query is empty, use preset defaults
  if (!trimmed && options.preset) {
    switch (options.preset) {
      case "pmat":
        baseQuery = 'TITLE-ABS-KEY("mathematics education" OR "mathematics learning")';
        break;
      case "ulm":
        baseQuery = 'AFFIL("Universitas Lambung Mangkurat") AND ("mathematics" OR "pendidikan")';
        break;
      case "rme":
        baseQuery = 'TITLE-ABS-KEY("realistic mathematics education" OR "RME" OR "PMRI")';
        break;
      case "ethnomath":
        baseQuery = 'TITLE-ABS-KEY("ethnomathematics" OR "ethno-mathematics")';
        break;
      case "hots":
        baseQuery = 'TITLE-ABS-KEY("mathematical problem solving" OR "higher order thinking" OR "HOTS") AND "mathematics"';
        break;
      default:
        baseQuery = 'TITLE-ABS-KEY("mathematics education")';
    }
  } else if (!trimmed) {
    baseQuery = 'TITLE-ABS-KEY("mathematics education")';
  } else {
    // If the query already contains Scopus field operators, pass directly
    const hasScopusSyntax =
      trimmed.includes("TITLE-ABS-KEY(") ||
      trimmed.includes("AUTH(") ||
      trimmed.includes("AFFIL(") ||
      trimmed.includes("EXACTSRCTITLE(") ||
      trimmed.includes("DOI(") ||
      trimmed.includes("KEY(");

    if (hasScopusSyntax) {
      baseQuery = trimmed;
    } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      baseQuery = `TITLE-ABS-KEY(${trimmed})`;
    } else {
      // Clean and split words, joining meaningful terms with AND for robust Scopus search
      const words = trimmed
        .replace(/["'(),]/g, " ")
        .split(/\s+/)
        .map((w) => w.trim())
        .filter(Boolean);

      if (words.length > 1) {
        const meaningfulWords = words.filter(
          (w) =>
            !["in", "of", "the", "at", "on", "to", "for", "a", "an", "is"].includes(
              w.toLowerCase(),
            ),
        );
        const terms = meaningfulWords.length > 0 ? meaningfulWords : words;
        baseQuery = `TITLE-ABS-KEY(${terms.join(" AND ")})`;
      } else if (words.length === 1) {
        baseQuery = `TITLE-ABS-KEY(${words[0]})`;
      } else {
        baseQuery = 'TITLE-ABS-KEY("mathematics education")';
      }
    }
  }

  const filters: string[] = [];

  // Year filter
  if (options.year && options.year !== "all") {
    if (options.year === "last5") {
      filters.push("PUBYEAR > 2020");
    } else if (options.year === "last3") {
      filters.push("PUBYEAR > 2022");
    } else {
      filters.push(`PUBYEAR = ${options.year}`);
    }
  }

  // Language filter
  if (options.language && options.language !== "all") {
    filters.push(`LANGUAGE(${options.language})`);
  }

  // Document Type filter
  if (options.docType && options.docType !== "all") {
    filters.push(`DOCTYPE(${options.docType})`);
  }

  // Open Access filter
  if (options.openAccessOnly) {
    filters.push("OPENACCESS(1)");
  }

  if (filters.length > 0) {
    return `(${baseQuery}) AND (${filters.join(" AND ")})`;
  }

  return baseQuery;
}

/**
 * Maps sort parameter to Scopus API sort value
 */
function mapSortOption(sort?: "relevance" | "newest" | "citations"): string {
  switch (sort) {
    case "newest":
      return "-coverDate";
    case "citations":
      return "-citedby-count";
    case "relevance":
    default:
      return "relevance";
  }
}

/**
 * Search articles from Elsevier Scopus API or fallback to curated demo
 */
export async function searchScopusArticles(
  options: ScopusSearchOptions,
): Promise<ScopusSearchResponse> {
  const apiKey = options.apiKey?.trim() || process.env.SCOPUS_API_KEY?.trim();
  const instToken = process.env.SCOPUS_INST_TOKEN?.trim();

  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(25, Math.max(5, options.pageSize ?? 12));
  const start = (page - 1) * pageSize;
  const formattedQuery = formatScopusQuery({
    rawQuery: options.query,
    preset: options.preset,
    year: options.year,
    language: options.language,
    docType: options.docType,
    openAccessOnly: options.openAccessOnly,
  });

  // If no Scopus API key is configured, use realistic mock dataset
  if (!apiKey) {
    return getMockScopusResponse(options, page, pageSize);
  }

  try {
    const scopusSort = mapSortOption(options.sort);
    const searchUrl = new URL("https://api.elsevier.com/content/search/scopus");
    searchUrl.searchParams.set("query", formattedQuery);
    searchUrl.searchParams.set("count", pageSize.toString());
    searchUrl.searchParams.set("start", start.toString());
    searchUrl.searchParams.set("sort", scopusSort);
    searchUrl.searchParams.set("view", "STANDARD");

    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-ELS-APIKey": apiKey,
    };

    if (instToken) {
      headers["X-ELS-Insttoken"] = instToken;
    }

    const response = await fetch(searchUrl.toString(), {
      headers,
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Scopus API error (${response.status}):`, errorText);
      // Fall back to curated mock if API key quota exceeded or invalid
      const fallback = getMockScopusResponse(options, page, pageSize);
      fallback.message = `Koneksi Scopus API (${response.status}). Menampilkan data simulasi terkurasi.`;
      return fallback;
    }

    const data = await response.json();
    const searchResults = data["search-results"];

    if (!searchResults) {
      return {
        articles: [],
        totalResults: 0,
        page,
        pageSize,
        totalPages: 0,
        isDemo: false,
      };
    }

    const rawEntries = (searchResults.entry ?? []) as Record<string, unknown>[];
    const totalResults = Number(searchResults["opensearch:totalResults"] ?? rawEntries.length);
    const totalPages = Math.ceil(totalResults / pageSize);

    const articles: ScopusArticle[] = rawEntries
      .filter((entry) => !entry.error)
      .map((entry) => parseScopusEntry(entry));

    return {
      articles,
      totalResults,
      page,
      pageSize,
      totalPages,
      isDemo: false,
    };
  } catch (error) {
    console.error("Error connecting to Scopus API:", error);
    const fallback = getMockScopusResponse(options, page, pageSize);
    fallback.message = "Gagal terhubung ke Elsevier Scopus API. Menampilkan data simulasi terkurasi.";
    return fallback;
  }
}

/**
 * Parses raw Scopus API entry into clean ScopusArticle
 */
function parseScopusEntry(entry: Record<string, unknown>): ScopusArticle {
  const title = String(entry["dc:title"] ?? "Tanpa Judul").replace(/\.$/, "");
  const authors = String(entry["dc:creator"] ?? "Peneliti Scopus");
  const journal = String(entry["prism:publicationName"] ?? "Jurnal Terindeks Scopus");
  const coverDate = String(entry["prism:coverDate"] ?? "");
  const year = coverDate ? coverDate.substring(0, 4) : String(entry["prism:coverDisplayDate"] ?? "2024");
  const doi = entry["prism:doi"] ? String(entry["prism:doi"]) : undefined;
  const doiUrl = doi ? `https://doi.org/${doi}` : undefined;
  const eid = String(entry.eid ?? entry["dc:identifier"] ?? Math.random().toString());

  // Extract scopus web link
  let scopusUrl: string | undefined;
  if (Array.isArray(entry.link)) {
    const scopusLinkObj = (entry.link as Record<string, string>[]).find(
      (l) => l["@ref"] === "scopus",
    );
    if (scopusLinkObj && scopusLinkObj["@href"]) {
      scopusUrl = scopusLinkObj["@href"];
    }
  }

  // Affiliation extraction
  const affiliations: string[] = [];
  if (Array.isArray(entry.affiliation)) {
    (entry.affiliation as Record<string, string>[]).forEach((aff) => {
      if (aff.affilname && !affiliations.includes(aff.affilname)) {
        affiliations.push(aff.affilname);
      }
    });
  }

  const citedByCount = Number(entry["citedby-count"] ?? 0);
  const aggregationType = String(entry["prism:aggregationType"] ?? "Journal");
  const subtypeDescription = String(entry.subtypeDescription ?? "Article");
  const openAccess = Boolean(entry.openaccess === "1" || entry.openaccess === true);

  return {
    id: eid,
    eid,
    title,
    authors,
    journal,
    coverDate,
    year,
    volume: entry["prism:volume"] ? String(entry["prism:volume"]) : undefined,
    issue: entry["prism:issueIdentifier"] ? String(entry["prism:issueIdentifier"]) : undefined,
    pages: entry["prism:pageRange"] ? String(entry["prism:pageRange"]) : undefined,
    doi,
    doiUrl,
    scopusUrl,
    citedByCount,
    affiliations,
    aggregationType,
    subtypeDescription,
    openAccess,
  };
}

/**
 * Format citation into APA 7th edition or BibTeX
 */
export function generateCitation(
  article: ScopusArticle,
  format: "apa" | "bibtex" = "apa",
): string {
  if (format === "bibtex") {
    const cleanId = (article.authors.split(",")[0] || "author")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") + article.year;
    return `@article{${cleanId},
  author = {${article.authors}},
  title = {${article.title}},
  journal = {${article.journal}},
  year = {${article.year}},
  ${article.volume ? `volume = {${article.volume}},` : ""}
  ${article.issue ? `number = {${article.issue}},` : ""}
  ${article.pages ? `pages = {${article.pages}},` : ""}
  ${article.doi ? `doi = {${article.doi}},` : ""}
}`;
  }

  // Default: APA 7th Edition
  const authorPart = article.authors.endsWith(".") ? article.authors : `${article.authors}.`;
  const yearPart = `(${article.year}).`;
  const titlePart = `${article.title}.`;
  const journalPart = `${article.journal}`;
  const volumePart = article.volume
    ? `, ${article.volume}${article.issue ? `(${article.issue})` : ""}`
    : "";
  const pagePart = article.pages ? `, ${article.pages}` : "";
  const doiPart = article.doiUrl ? ` ${article.doiUrl}` : "";

  return `${authorPart} ${yearPart} ${titlePart} ${journalPart}${volumePart}${pagePart}.${doiPart}`;
}

/**
 * Curated high-quality mock research dataset for mathematics education & ULM
 */
const MOCK_SCOPUS_ARTICLES: ScopusArticle[] = [
  {
    id: "scopus-mock-1",
    eid: "2-s2.0-85149302111",
    title:
      "Developing Realistic Mathematics Education (RME) Learning Trajectory to Enhance Students' Higher Order Thinking Skills",
    authors: "Arifin, Z., Suryadi, D., & Turmudi, T.",
    journal: "Journal of Mathematical Behavior",
    coverDate: "2024-03-15",
    year: "2024",
    volume: "73",
    pages: "101124",
    doi: "10.1016/j.jmathb.2024.101124",
    doiUrl: "https://doi.org/10.1016/j.jmathb.2024.101124",
    scopusUrl: "https://www.scopus.com",
    citedByCount: 28,
    affiliations: ["Universitas Lambung Mangkurat", "Universitas Pendidikan Indonesia"],
    aggregationType: "Journal",
    subtypeDescription: "Article",
    openAccess: true,
  },
  {
    id: "scopus-mock-2",
    eid: "2-s2.0-85158291032",
    title:
      "Ethnomathematics on Sasirangan Traditional Fabric: Mathematical Patterns and Context-Based Geometric Transformations in South Kalimantan",
    authors: "Rahmadi, I., Noor, M., & Hidayah, N.",
    journal: "International Journal of Science and Mathematics Education",
    coverDate: "2023-11-20",
    year: "2023",
    volume: "21",
    issue: "8",
    pages: "2201-2223",
    doi: "10.1007/s10763-023-10412-1",
    doiUrl: "https://doi.org/10.1007/s10763-023-10412-1",
    scopusUrl: "https://www.scopus.com",
    citedByCount: 34,
    affiliations: ["Universitas Lambung Mangkurat"],
    aggregationType: "Journal",
    subtypeDescription: "Article",
    openAccess: false,
  },
  {
    id: "scopus-mock-3",
    eid: "2-s2.0-85169482103",
    title:
      "The Effectiveness of Augmented Reality-Assisted Dynamic Geometry Learning in Improving Spatial Visualization Ability",
    authors: "Pratama, H., Kusumah, Y.S., & Arifin, Z.",
    journal: "Computers & Education",
    coverDate: "2024-01-10",
    year: "2024",
    volume: "208",
    pages: "104950",
    doi: "10.1016/j.compedu.2023.104950",
    doiUrl: "https://doi.org/10.1016/j.compedu.2023.104950",
    scopusUrl: "https://www.scopus.com",
    citedByCount: 42,
    affiliations: ["Universitas Lambung Mangkurat", "Institut Teknologi Bandung"],
    aggregationType: "Journal",
    subtypeDescription: "Article",
    openAccess: true,
  },
  {
    id: "scopus-mock-4",
    eid: "2-s2.0-85172819234",
    title:
      "Mathematical Problem-Solving Strategies of Prospective Teachers: An Error Analysis Based on Newman's Framework",
    authors: "Fauziah, R., & Wulandari, S.",
    journal: "Educational Studies in Mathematics",
    coverDate: "2023-09-01",
    year: "2023",
    volume: "114",
    issue: "2",
    pages: "189-211",
    doi: "10.1007/s10649-023-10255-7",
    doiUrl: "https://doi.org/10.1007/s10649-023-10255-7",
    scopusUrl: "https://www.scopus.com",
    citedByCount: 19,
    affiliations: ["Universitas Lambung Mangkurat"],
    aggregationType: "Journal",
    subtypeDescription: "Article",
    openAccess: false,
  },
  {
    id: "scopus-mock-5",
    eid: "2-s2.0-85181920394",
    title:
      "Integrating STEM Approaches in Secondary Mathematics Education: Fostering 21st-Century Competencies in Wetland Environments",
    authors: "Saputra, A., Zainuddin, M., & Lestari, P.",
    journal: "Thinking Skills and Creativity",
    coverDate: "2024-06-12",
    year: "2024",
    volume: "52",
    pages: "101512",
    doi: "10.1016/j.tsc.2024.101512",
    doiUrl: "https://doi.org/10.1016/j.tsc.2024.101512",
    scopusUrl: "https://www.scopus.com",
    citedByCount: 15,
    affiliations: ["Universitas Lambung Mangkurat"],
    aggregationType: "Journal",
    subtypeDescription: "Article",
    openAccess: true,
  },
  {
    id: "scopus-mock-6",
    eid: "2-s2.0-85139401923",
    title:
      "Pedagogical Content Knowledge of Mathematics Lecturers in Fostering Creative Thinking: A Case Study in Teacher Training Institutions",
    authors: "Wijaya, B., & Setiawan, A.",
    journal: "Teaching and Teacher Education",
    coverDate: "2022-10-18",
    year: "2022",
    volume: "119",
    pages: "103859",
    doi: "10.1016/j.tate.2022.103859",
    doiUrl: "https://doi.org/10.1016/j.tate.2022.103859",
    scopusUrl: "https://www.scopus.com",
    citedByCount: 56,
    affiliations: ["Universitas Lambung Mangkurat", "Universitas Gadjah Mada"],
    aggregationType: "Journal",
    subtypeDescription: "Article",
    openAccess: false,
  },
  {
    id: "scopus-mock-7",
    eid: "2-s2.0-85189301924",
    title:
      "Assessing Students' Metacognitive Awareness in Solving Non-Routine Calculus Problems Using Eye-Tracking Analytics",
    authors: "Hendrawan, B., Arifin, Z., & Firdaus, M.",
    journal: "ZDM – Mathematics Education",
    coverDate: "2024-04-22",
    year: "2024",
    volume: "56",
    issue: "3",
    pages: "431-447",
    doi: "10.1007/s11858-024-01582-w",
    doiUrl: "https://doi.org/10.1007/s11858-024-01582-w",
    scopusUrl: "https://www.scopus.com",
    citedByCount: 22,
    affiliations: ["Universitas Lambung Mangkurat"],
    aggregationType: "Journal",
    subtypeDescription: "Article",
    openAccess: true,
  },
  {
    id: "scopus-mock-8",
    eid: "2-s2.0-85150293812",
    title:
      "Comparative Analysis of Peer-Led vs. Instructor-Led Collaborative Learning in Undergraduate Linear Algebra",
    authors: "Susanto, D., Kurniawan, R., & Hartono, Y.",
    journal: "International Journal of Mathematical Education in Science and Technology",
    coverDate: "2023-05-14",
    year: "2023",
    volume: "54",
    issue: "7",
    pages: "1289-1309",
    doi: "10.1080/0020739X.2023.2189021",
    doiUrl: "https://doi.org/10.1080/0020739X.2023.2189021",
    scopusUrl: "https://www.scopus.com",
    citedByCount: 17,
    affiliations: ["Universitas Lambung Mangkurat"],
    aggregationType: "Journal",
    subtypeDescription: "Article",
    openAccess: false,
  },
];

function getMockScopusResponse(
  options: ScopusSearchOptions,
  page = 1,
  pageSize = 12,
): ScopusSearchResponse {
  let filtered = [...MOCK_SCOPUS_ARTICLES];
  const q = options.query.trim().toLowerCase();

  if (options.preset === "ulm") {
    filtered = filtered.filter((art) =>
      art.affiliations.some((aff) => aff.toLowerCase().includes("lambung mangkurat")),
    );
  } else if (options.preset === "rme") {
    filtered = filtered.filter((art) =>
      art.title.toLowerCase().includes("realistic") || art.title.toLowerCase().includes("rme"),
    );
  } else if (options.preset === "ethnomath") {
    filtered = filtered.filter((art) =>
      art.title.toLowerCase().includes("ethnomathematics") || art.title.toLowerCase().includes("sasirangan"),
    );
  }

  // Filter year
  if (options.year && options.year !== "all") {
    if (options.year === "last5") {
      filtered = filtered.filter((art) => parseInt(art.year, 10) >= 2021);
    } else if (options.year === "last3") {
      filtered = filtered.filter((art) => parseInt(art.year, 10) >= 2023);
    } else {
      filtered = filtered.filter((art) => art.year === options.year);
    }
  }

  // Filter open access
  if (options.openAccessOnly) {
    filtered = filtered.filter((art) => art.openAccess);
  }

  // Filter docType
  if (options.docType && options.docType !== "all") {
    if (options.docType === "ar") {
      filtered = filtered.filter((art) => art.subtypeDescription.toLowerCase().includes("article"));
    } else if (options.docType === "cp") {
      filtered = filtered.filter((art) => art.subtypeDescription.toLowerCase().includes("conference"));
    }
  }

  if (q) {
    filtered = filtered.filter(
      (art) =>
        art.title.toLowerCase().includes(q) ||
        art.authors.toLowerCase().includes(q) ||
        art.journal.toLowerCase().includes(q) ||
        art.affiliations.some((aff) => aff.toLowerCase().includes(q)),
    );
  }

  // Sorting
  if (options.sort === "newest") {
    filtered.sort((a, b) => b.year.localeCompare(a.year));
  } else if (options.sort === "citations") {
    filtered.sort((a, b) => b.citedByCount - a.citedByCount);
  }

  const totalResults = filtered.length;
  const totalPages = Math.ceil(totalResults / pageSize);
  const start = (page - 1) * pageSize;
  const articles = filtered.slice(start, start + pageSize);

  return {
    articles,
    totalResults,
    page,
    pageSize,
    totalPages,
    isDemo: true,
    message: "Mode Demo / Simulasi: Menggunakan data terkurasi publikasi Pendidikan Matematika ULM.",
  };
}
