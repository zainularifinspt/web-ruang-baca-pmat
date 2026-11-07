import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { createClient } from "@supabase/supabase-js";
import { READER_POLICY } from "../lib/reader/core.ts";
import {
  PILOT_BOOK_ID,
  PILOT_BOOK_KEY,
  PILOT_BUCKET,
} from "../lib/reader/pilot-config.ts";

createRequire(import.meta.url)("@next/env").loadEnvConfig(process.cwd());
const root = resolve(
  process.env.READER_DATA_DIR || ".reader-data",
  PILOT_BOOK_KEY,
);
const doc = JSON.parse(await readFile(join(root, "document.json"), "utf8"));
if (
  doc.schema !== 1 ||
  doc.kind !== "book" ||
  doc.collectionId !== PILOT_BOOK_ID ||
  doc.key !== PILOT_BOOK_KEY ||
  doc.policy !== READER_POLICY ||
  !/^[a-f0-9]{20}$/.test(doc.revision) ||
  !doc.pages.length ||
  doc.pages.length !== doc.totalPages
)
  throw new Error("Dokumen lokal bukan revisi buku uji yang valid.");

const assets = doc.pages.flatMap((page) => [
  page.image,
  page.thumbnail,
  page.hd,
]);
if (assets.some((file) => !/^\d+-(read|thumb|hd)\.webp$/.test(file))) {
  throw new Error("Nama aset buku uji tidak valid.");
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const { data: buckets, error: listError } = await db.storage.listBuckets();
if (listError) throw listError;
const existing = buckets.find((bucket) => bucket.id === PILOT_BUCKET);
if (existing?.public) throw new Error("Penyimpanan buku uji harus privat.");
if (!existing) {
  const { error } = await db.storage.createBucket(PILOT_BUCKET, {
    public: false,
  });
  if (error) throw error;
}

const bucket = db.storage.from(PILOT_BUCKET);
const prefix = `${PILOT_BOOK_KEY}/${doc.revision}`;
const metadata = {
  ...doc,
  embeddingModel: undefined,
  embeddingReady: false,
  chunks: [],
  pages: doc.pages.map((page) => ({ ...page, text: "", words: [] })),
};

async function upload(path, body, contentType) {
  const { error } = await bucket.upload(path, body, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`${path}: ${error.message}`);
}

// Upload revision files first so a failed transfer cannot activate an incomplete book.
for (let offset = 0; offset < assets.length; offset += 8) {
  await Promise.all(
    assets.slice(offset, offset + 8).map(async (file) => {
      await upload(
        `${prefix}/${file}`,
        await readFile(join(root, doc.revision, file)),
        "image/webp",
      );
    }),
  );
  const sent = Math.min(offset + 8, assets.length);
  if (sent % 96 === 0 || sent === assets.length)
    console.log(`Aset diunggah: ${sent}/${assets.length}`);
}
await upload(
  `${prefix}/pages.json.gz`,
  gzipSync(JSON.stringify(doc.pages)),
  "application/gzip",
);
await upload(
  `${PILOT_BOOK_KEY}/document.json`,
  JSON.stringify(metadata),
  "application/json",
);
console.log(
  `Buku uji siap: ${doc.pages.length} halaman, revisi ${doc.revision}.`,
);
