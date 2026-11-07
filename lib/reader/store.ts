import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { publicCollection, sourceUrl } from "./catalog";
import {
  READER_POLICY,
  readerKey,
  readerUrl,
  searchPages,
  snippet,
  retrieveChunks,
  queryTerms,
  hasPoorWordBoundaries,
} from "./core";
import type {
  ReaderDocument,
  ReaderKind,
  ReaderSource,
  ReaderPage,
  SearchHit,
} from "./types";

export const readerLocal = () =>
  process.env.READER_STORAGE === "local" ||
  (process.env.NODE_ENV !== "production" && !process.env.READER_STORAGE);
export const dataRoot = () =>
  path.resolve(
    /* turbopackIgnore: true */ process.env.READER_DATA_DIR || ".reader-data",
  );
const documentCache = new Map<string, { mtime: number; doc: ReaderDocument }>();
export async function readLocalDocument(
  key: string,
): Promise<ReaderDocument | null> {
  if (!/^(book|thesis)-[a-zA-Z0-9_-]{1,160}$/.test(key)) return null;
  try {
    const file = path.join(dataRoot(), key, "document.json");
    const mtime = (await stat(file)).mtimeMs;
    const cached = documentCache.get(key);
    if (cached?.mtime === mtime) return cached.doc;
    const doc = JSON.parse(await readFile(file, "utf8"));
    if (documentCache.size > 8)
      documentCache.delete(documentCache.keys().next().value!);
    documentCache.set(key, { mtime, doc });
    return doc;
  } catch {
    return null;
  }
}
export async function getReaderDocument(
  kind: ReaderKind,
  id: string,
): Promise<ReaderDocument | null> {
  const item = await publicCollection(kind, id);
  if (!item) return null;
  const key = readerKey(kind, id);
  let doc: ReaderDocument | null = null;
  if (readerLocal()) doc = await readLocalDocument(key);
  else {
    const db = createSupabaseAdminClient();
    const { data: d, error } = await db
      .from("reader_documents")
      .select("*")
      .eq("id", key)
      .eq("is_public", true)
      .maybeSingle();
    if (error)
      throw new Error(
        "Penyimpanan pembaca belum diaktifkan. Silakan gunakan katalog sementara.",
      );
    if (!d?.active_revision) return null;
    const [{ data: v }, { data: pages, error: pe }] = await Promise.all([
      db
        .from("reader_document_versions")
        .select("*")
        .eq("document_id", key)
        .eq("id", d.active_revision)
        .single(),
      db
        .from("reader_pages")
        .select("page_number,label,width,height,image,thumbnail,hd,quality")
        .eq("document_id", key)
        .eq("revision", d.active_revision)
        .order("page_number")
        .limit(1000),
    ]);
    if (!v || pe) return null;
    doc = {
      schema: 1,
      key,
      collectionId: id,
      kind,
      title: d.title,
      author: d.author,
      revision: v.id,
      sourceHash: v.source_hash,
      sourceUrl: v.source_url,
      policy: v.policy,
      createdAt: v.created_at,
      totalPages: v.total_pages,
      outline: v.outline,
      embeddingModel: v.embedding_model,
      embeddingReady: v.embedding_ready,
      pages: (pages || []).map((p) => ({
        ...p,
        number: p.page_number,
        text: "",
        words: [],
        quality: p.quality,
      })),
      chunks: [],
    };
  }
  if (!doc || doc.policy !== READER_POLICY || doc.sourceUrl !== sourceUrl(item))
    return null;
  return doc;
}
export async function readerPage(
  doc: ReaderDocument,
  number: number,
): Promise<ReaderPage | null> {
  if (readerLocal()) return doc.pages.find((p) => p.number === number) || null;
  const { data } = await createSupabaseAdminClient()
    .from("reader_pages")
    .select("*")
    .eq("document_id", doc.key)
    .eq("revision", doc.revision)
    .eq("page_number", number)
    .maybeSingle();
  return data
    ? { ...data, number: data.page_number, text: data.text_content }
    : null;
}
export async function searchDocument(
  doc: ReaderDocument,
  query: string,
  offset: number,
): Promise<SearchHit[]> {
  if (readerLocal()) return searchPages(doc, query).slice(offset, offset + 21);
  const { data, error } = await createSupabaseAdminClient().rpc(
    "reader_search",
    {
      p_document: doc.key,
      p_revision: doc.revision,
      p_query: query,
      p_offset: offset,
    },
  );
  if (error) throw new Error("Pencarian belum dapat dijalankan.");
  return (data || []).map(
    (p: {
      page_number: number;
      label: string;
      text_content: string;
      score: number;
    }): SearchHit => ({
      page: p.page_number,
      label: p.label,
      excerpt: snippet(p.text_content, query),
      score: p.score,
      quality: hasPoorWordBoundaries(p.text_content) ? "poor" : "text",
      matches: [],
    }),
  );
}
export async function retrieveSources(
  query: string,
  doc: ReaderDocument | null,
  embedding?: number[],
  page?: number,
): Promise<ReaderSource[]> {
  if (readerLocal()) {
    const keys = doc
      ? [doc.key]
      : await readdir(/* turbopackIgnore: true */ dataRoot()).catch(() => []);
    const found: { source: ReaderSource; score: number }[] = [];
    for (const key of keys) {
      const candidate = doc || (await readLocalDocument(key));
      if (!candidate) continue;
      const allowed =
        doc ||
        (await getReaderDocument(candidate.kind, candidate.collectionId));
      if (!allowed) continue;
      for (const c of retrieveChunks(
        allowed,
        query,
        allowed.embeddingReady ? embedding : undefined,
        page,
      )) {
        const p = allowed.pages.find((p) => p.number === c.page);
        found.push({
          score: c.score,
          source: {
            id: `${allowed.key}:${allowed.revision}:${c.id}`,
            title: allowed.title,
            author: allowed.author,
            page: c.page,
            label: p?.label,
            revision: allowed.revision,
            url: readerUrl(
              allowed.kind,
              allowed.collectionId,
              c.page,
              allowed.revision,
            ),
            excerpt: c.text,
          },
        });
      }
    }
    return found
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((f) => f.source);
  }
  const { data, error } = await createSupabaseAdminClient().rpc(
    "reader_retrieve",
    {
      p_query: queryTerms(query).join(" "),
      p_document: doc?.key || null,
      p_page: page || null,
      p_embedding: embedding ? JSON.stringify(embedding) : null,
    },
  );
  if (error) throw new Error("Indeks dokumen belum tersedia.");
  const result: ReaderSource[] = [];
  const checks = new Map<string, ReaderDocument | null>();
  for (const row of data || []) {
    if (!checks.has(row.document_id))
      checks.set(
        row.document_id,
        await getReaderDocument(row.kind, row.collection_id),
      );
    if (checks.get(row.document_id)?.revision !== row.revision) continue;
    result.push({
      id: `${row.document_id}:${row.revision}:${row.id}`,
      title: row.title,
      author: row.author,
      page: row.page_number,
      label: row.label,
      revision: row.revision,
      url: readerUrl(
        row.kind,
        row.collection_id,
        row.page_number,
        row.revision,
      ),
      excerpt: row.text_content,
    });
  }
  return result;
}
