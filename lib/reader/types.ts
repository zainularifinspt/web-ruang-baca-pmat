export type ReaderKind = "book" | "thesis";
export type ReaderWord = {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
};
export type ReaderPage = {
  number: number;
  label: string;
  width: number;
  height: number;
  text: string;
  image: string;
  thumbnail: string;
  hd: string;
  words: ReaderWord[];
  quality: "text" | "ocr" | "image" | "poor";
};
export type ReaderChunk = {
  id: string;
  page: number;
  text: string;
  embedding?: number[];
};
export type ReaderDocument = {
  schema: 1;
  storage?: "pilot";
  key: string;
  collectionId: string;
  kind: ReaderKind;
  title: string;
  author: string;
  revision: string;
  sourceHash: string;
  sourceUrl: string;
  policy: string;
  createdAt: string;
  totalPages: number;
  pages: ReaderPage[];
  chunks: ReaderChunk[];
  outline: { title: string; page: number }[];
  embeddingModel?: string;
  embeddingReady: boolean;
};
export type ReaderManifest = {
  key: string;
  collectionId: string;
  kind: ReaderKind;
  title: string;
  author: string;
  revision: string;
  totalPages: number;
  pages: Omit<ReaderPage, "text" | "words" | "quality">[];
  outline: { title: string; page: number }[];
  searchReady: boolean;
  textPages: number;
  aiReady: boolean;
  embeddingReady: boolean;
};
export type ReaderSource = {
  id: string;
  title: string;
  author: string;
  url: string;
  page?: number;
  label?: string;
  excerpt: string;
  revision?: string;
};
export type SearchHit = {
  page: number;
  label: string;
  excerpt: string;
  quality?: ReaderPage["quality"];
  matches: ReaderWord[];
  score: number;
};
export type ChatResult = {
  paragraphs: string[];
  sources: ReaderSource[];
  status: "answered" | "not_found" | "unavailable";
  remaining?: number;
};
