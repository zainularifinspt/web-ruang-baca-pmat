import { gunzipSync } from "node:zlib";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { PILOT_BOOK_ID, PILOT_BOOK_KEY, PILOT_BUCKET } from "./pilot-config";
import type { ReaderDocument, ReaderPage } from "./types";

let manifestCache:
  | {
      until: number;
      value: Promise<ReaderDocument | null>;
    }
  | undefined;
let pagesCache: { revision: string; value: Promise<ReaderPage[]> } | undefined;

function pilotBucket() {
  return createSupabaseAdminClient().storage.from(PILOT_BUCKET);
}

async function loadManifest(): Promise<ReaderDocument | null> {
  const { data, error } = await pilotBucket().download(
    `${PILOT_BOOK_KEY}/document.json`,
  );
  if (error || !data) return null;
  const doc: ReaderDocument = JSON.parse(await data.text());
  if (
    doc.schema !== 1 ||
    doc.kind !== "book" ||
    doc.key !== PILOT_BOOK_KEY ||
    doc.collectionId !== PILOT_BOOK_ID ||
    !/^[a-f0-9]{20}$/.test(doc.revision) ||
    !Array.isArray(doc.pages) ||
    doc.pages.length !== doc.totalPages
  )
    return null;
  return { ...doc, storage: "pilot" };
}

export function readPilotBook() {
  if (!manifestCache || Date.now() >= manifestCache.until) {
    const value = loadManifest();
    manifestCache = { until: Date.now() + 30_000, value };
    void value.catch(() => {
      if (manifestCache?.value === value) manifestCache = undefined;
    });
  }
  return manifestCache.value;
}

export function readPilotPages(revision: string) {
  if (!pagesCache || pagesCache.revision !== revision) {
    const value = (async (): Promise<ReaderPage[]> => {
      const { data, error } = await pilotBucket().download(
        `${PILOT_BOOK_KEY}/${revision}/pages.json.gz`,
      );
      if (error || !data) throw new Error("Teks buku uji belum dapat dimuat.");
      const content = gunzipSync(Buffer.from(await data.arrayBuffer()), {
        maxOutputLength: 16 * 1024 * 1024,
      });
      return JSON.parse(content.toString("utf8"));
    })();
    pagesCache = { revision, value };
    void value.catch(() => {
      if (pagesCache?.value === value) pagesCache = undefined;
    });
  }
  return pagesCache.value;
}
