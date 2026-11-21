import { createRequire } from "node:module";
import {
  mkdir,
  readFile,
  writeFile,
  rename,
  rm,
  copyFile,
} from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import {
  READER_POLICY,
  readerKey,
  chunkPages,
  hasVerifiedCatalogSource,
} from "../lib/reader/core.ts";
import { downloadPdf } from "../lib/reader/network.ts";
const require = createRequire(import.meta.url);
require("@next/env").loadEnvConfig(process.cwd());
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = option(
  "--catalog",
  process.env.READER_CATALOG_URL || "http://127.0.0.1:3000",
);
const mode = option("--storage", process.env.READER_STORAGE || "local");
if (!["local", "supabase", "r2"].includes(mode))
  throw Error("Gunakan --storage local, supabase, atau r2.");
const limit = Number(option("--limit", "1"));
if (!Number.isInteger(limit) || limit < 1)
  throw Error("Gunakan --limit angka positif, atau --all.");
const root = resolve(process.env.READER_DATA_DIR || ".reader-data");
await mkdir(root, { recursive: true });
const db =
  mode === "local"
    ? null
    : createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );
const wanted = option("--id", "");
const kind = option("--kind", "book");
const retryLog = option("--retry-log", "");
if (args.includes("--retry-log") && (!retryLog || retryLog.startsWith("--")))
  throw Error("--retry-log memerlukan path log batch.");
const retryIds = retryLog
  ? new Set(Array.from((await readFile(retryLog, "utf8")).matchAll(/^Gagal ([a-zA-Z0-9_-]{1,160}):/gm), ([, id]) => id))
  : null;
if (retryIds?.size === 0) {
  console.log("Tidak ada dokumen gagal pada log batch.");
  process.exit(0);
}
const textOnly = args.includes("--text-only");
if (textOnly && kind !== "thesis")
  throw Error("--text-only hanya tersedia untuk skripsi.");
const concurrency = Number(option("--concurrency", "1"));
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4 ||
    (concurrency > 1 && (!textOnly || args.includes("--job-id"))))
  throw Error("Gunakan --concurrency 1–4 untuk batch teks skripsi tanpa --job-id.");
const embeddingUrl = args.includes("--no-embeddings")
  ? ""
  : process.env.READER_EMBEDDING_URL;
const embeddingModel = embeddingUrl
  ? process.env.READER_EMBEDDING_MODEL || "Xenova/multilingual-e5-small"
  : undefined;
const pdfSource = (item) => item.pdfR2?.trim() || item.pdfUrl?.trim() || "";
const all = new Map();
for (let offset = 0; offset < 100000; offset += 500) {
  const res = await fetch(
    `${base.replace(/\/$/, "")}/api/catalog?visibility=public&limit=500&offset=${offset}`,
    { signal: AbortSignal.timeout(60000) },
  );
  const p = await res.json();
  if (!res.ok || p.error)
    throw Error("Katalog belum dapat dibaca; pengindeksan dihentikan.");
  for (const item of [...(p.books || []), ...(p.theses || [])])
    all.set(`${item.type}:${item.id}`, item);
  if (
    (p.theses || []).length < 500 &&
    (p.books || []).filter((x) => !x.isEbook).length < 500
  )
    break;
}
const collection = [...all.values()].filter(
  (x) =>
    x.type === kind &&
    hasVerifiedCatalogSource(x) &&
    (!wanted || x.id === wanted) &&
    (!retryIds || retryIds.has(x.id)) &&
    !/^ebk-\d+$/.test(x.id),
);
const missingPdf = collection.filter((item) => !pdfSource(item));
const allSelected = args.includes("--all") || Boolean(retryIds);
const items = collection
  .filter(pdfSource)
  .slice(0, allSelected ? undefined : limit);
console.log(`Katalog: ${collection.length}; PDF dipilih: ${items.length}; tanpa sumber PDF: ${missingPdf.length}.`);
if (allSelected || wanted)
  for (const item of missingPdf) console.error(`Tanpa sumber PDF: ${item.id}`);
if (!items.length)
  throw Error(
    "Tidak ada dokumen dengan sumber dan identitas stabil yang cocok.",
  );
let failures = 0;
let published = 0;
let skipped = 0;
async function check(promise) {
  const result = await promise;
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
async function runPython(file, dir, type) {
  const timeoutMinutes = type === "book" ? 30 : 10;
  const extractorArgs = ["scripts/reader-extract.py", file, dir, "--kind", type];
  if (textOnly) extractorArgs.push("--text-only");
  await new Promise((ok, no) => {
    const child = spawn(
      process.env.READER_PYTHON || "python3",
      extractorArgs,
      {
        stdio: "inherit",
        env: concurrency > 1 ? { ...process.env, READER_OCR_WORKERS: "1" } : process.env,
      },
    );
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      no(Error(`Pemrosesan melewati ${timeoutMinutes} menit.`));
    }, timeoutMinutes * 60000);
    child.on("error", no);
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) ok();
      else no(Error("Pemrosesan PDF gagal; lihat pesan di atas."));
    });
  });
}
async function embed(texts) {
  const res = await fetch(embeddingUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.READER_EMBEDDING_KEY
        ? { Authorization: `Bearer ${process.env.READER_EMBEDDING_KEY}` }
        : {}),
    },
    body: JSON.stringify({ texts: texts.map((t) => "passage: " + t) }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw Error("Layanan embedding gagal.");
  const value = await res.json();
  if (
    !Array.isArray(value.embeddings) ||
    value.embeddings.length !== texts.length ||
    value.embeddings.some(
      (v) =>
        !Array.isArray(v) ||
        v.length !== 384 ||
        v.some((x) => !Number.isFinite(x)),
    )
  )
    throw Error("Embedding harus vektor 384 dimensi.");
  return value.embeddings;
}
async function indexItem(item) {
  const key = readerKey(item.type, item.id);
  const job = option("--job-id", randomUUID());
  const work = join(root, `.work-${job}`);
  try {
    if (db)
      await check(db.from("reader_jobs").upsert({ id: job, document_id: key, status: "processing" }));
    const sourceUrl = pdfSource(item);
    console.log(`Memproses ${item.type} ${item.id}`);
    const data = await downloadPdf(sourceUrl);
    const hash = createHash("sha256").update(data).digest("hex");
    const revision = createHash("sha256")
      .update(
        hash +
          READER_POLICY +
          (textOnly ? "thesis-text-v2" : "render-v3-webp" + (process.env.READER_WEBP_QUALITY || "88")) +
          (textOnly ? embeddingModel || "none" : process.env.READER_EMBEDDING_MODEL || "none") +
          (!textOnly && args.includes("--no-embeddings") ? "no-embeddings" : "") +
          (args.includes("--force") ? job : ""),
      )
      .digest("hex")
      .slice(0, 20);
    const current = mode === "local" ? await readFile(join(root, key, "document.json"), "utf8")
      .then(JSON.parse)
      .catch(() => null) : null;
    const active = db && textOnly && !args.includes("--force")
      ? await check(db.from("reader_documents").select("active_revision,is_public").eq("id", key).maybeSingle())
      : null;
    const activeVersion = active?.is_public && active.active_revision === revision
      ? await check(db.from("reader_document_versions").select("source_url").eq("document_id", key).eq("id", revision).maybeSingle())
      : null;
    if (
      (current?.revision === revision && current.sourceUrl === sourceUrl && !args.includes("--force")) ||
      activeVersion?.source_url === sourceUrl
    ) {
      skipped++;
      console.log(`Versi sudah siap; dilewati: ${item.id}.`);
      if (db)
        await db
          .from("reader_jobs")
          .update({
            status: "ready",
            progress: 100,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job);
      return;
    }
    await mkdir(work, { recursive: true });
    const pdf = join(work, "source.pdf");
    await writeFile(pdf, data);
    await runPython(pdf, work, item.type);
    const parsed = JSON.parse(
      await readFile(join(work, "extracted.json"), "utf8"),
    );
    const chunks = chunkPages(parsed.pages);
    if (textOnly && !chunks.length)
      throw Error("Tidak ada teks halaman yang layak dijadikan sumber Tama.");
    const embeddingReady = Boolean(embeddingUrl && chunks.length);
    if (embeddingReady) {
      for (let i = 0; i < chunks.length; i += 16) {
        const vectors = await embed(chunks.slice(i, i + 16).map((c) => c.text));
        vectors.forEach((v, j) => (chunks[i + j].embedding = v));
      }
    }
    const doc = {
      schema: 1,
      key,
      collectionId: item.id,
      kind: item.type,
      title: item.title,
      author: item.type === "book" ? item.author : item.studentName,
      revision,
      sourceHash: hash,
      sourceUrl,
      policy: READER_POLICY,
      createdAt: new Date().toISOString(),
      ...parsed,
      chunks,
      embeddingReady,
      embeddingModel: embeddingReady ? embeddingModel : undefined,
    };
    // Originals and hidden page material never enter the asset directory.
    await rm(pdf);
    await rm(join(work, "extracted.json"));
    if (db) {
      const bucket = process.env.READER_ASSET_BUCKET || "reader-assets";
      if (!textOnly && mode === "r2") {
        const { S3Client, PutObjectCommand } =
          await import("@aws-sdk/client-s3");
        const s3 = new S3Client({
          region: "auto",
          endpoint: process.env.R2_ENDPOINT,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
          },
        });
        for (const p of doc.pages)
          for (const f of [p.image, p.thumbnail, p.hd])
            await s3.send(
              new PutObjectCommand({
                Bucket: process.env.R2_READER_BUCKET,
                Key: `${key}/${revision}/${f}`,
                Body: await readFile(join(work, f)),
                ContentType: "image/webp",
              }),
            );
      } else if (!textOnly) {
        const { data: buckets, error: be } = await db.storage.listBuckets();
        if (be) throw be;
        if (!buckets.some((b) => b.name === bucket)) {
          const { error } = await db.storage.createBucket(bucket, {
            public: false,
            allowedMimeTypes: ["image/webp"],
            fileSizeLimit: 5 * 1024 * 1024,
          });
          if (error) throw error;
        }
        for (const p of doc.pages)
          for (const f of [p.image, p.thumbnail, p.hd]) {
            const { error } = await db.storage
              .from(bucket)
              .upload(
                `${key}/${revision}/${f}`,
                await readFile(join(work, f)),
                { contentType: "image/webp", upsert: true },
              );
            if (error) throw error;
          }
      }
      await check(
        db.from("reader_documents").upsert({
          id: key,
          collection_id: item.id,
          kind: item.type,
          title: item.title,
          author: doc.author,
        }),
      );
      await check(
        db.from("reader_document_versions").upsert({
          id: revision,
          document_id: key,
          source_hash: hash,
          source_url: sourceUrl,
          policy: READER_POLICY,
          total_pages: doc.totalPages,
          outline: doc.outline,
          embedding_ready: embeddingReady,
          embedding_model: doc.embeddingModel || null,
        }),
      );
      const pageBatchSize = textOnly ? 100 : 20;
      for (let i = 0; i < doc.pages.length; i += pageBatchSize)
        await check(
          db.from("reader_pages").upsert(
            doc.pages.slice(i, i + pageBatchSize).map((p) => ({
              document_id: key,
              revision,
              page_number: p.number,
              label: p.label,
              width: p.width,
              height: p.height,
              text_content: textOnly ? "" : p.text,
              image: p.image,
              thumbnail: p.thumbnail,
              hd: p.hd,
              words: p.words,
              quality: p.quality,
            })),
          ),
        );
      const chunkBatchSize = textOnly ? 100 : 50;
      for (let i = 0; i < chunks.length; i += chunkBatchSize)
        await check(
          db.from("reader_chunks").upsert(
            chunks.slice(i, i + chunkBatchSize).map((c) => ({
              document_id: key,
              revision,
              id: c.id,
              page_number: c.page,
              text_content: c.text,
              embedding: c.embedding ? JSON.stringify(c.embedding) : null,
            })),
          ),
        );
      // Activate only after all assets and rows have been written.
      await check(
        db
          .from("reader_documents")
          .update({
            active_revision: revision,
            is_public: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", key),
      );
      await db
        .from("reader_jobs")
        .update({
          status: "ready",
          progress: 100,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job);
    }
    if (!db || !textOnly) {
      const destination = join(root, key, revision);
      await mkdir(destination, { recursive: true });
      for (const p of doc.pages)
        for (const f of [p.image, p.thumbnail, p.hd].filter(Boolean))
          await copyFile(join(work, f), join(destination, f));
      await writeFile(
        join(root, key, "document.pending.json"),
        JSON.stringify(doc),
      );
      await rename(
        join(root, key, "document.pending.json"),
        join(root, key, "document.json"),
      );
    }
    published++;
    console.log(
      `Siap: ${item.id}; ${doc.pages.length} halaman, ${chunks.length} potongan, embedding ${embeddingReady ? "aktif" : "belum diaktifkan"}.`,
    );
  } catch (error) {
    failures++;
    console.error(
      `Gagal ${item.id}:`,
      error instanceof Error ? error.message : "Gagal menyiapkan dokumen",
    );
    if (db)
      await db
        .from("reader_jobs")
        .update({
          status: "failed",
          message: "Pemrosesan gagal; periksa worker.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
const pending = items.values();
await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
  for (const item of pending) await indexItem(item);
}));
console.log(`Selesai: ${published} diproses, ${skipped} sudah aktif, ${failures} gagal, ${missingPdf.length} tanpa sumber PDF.`);
if (failures || ((allSelected || wanted) && missingPdf.length))
  process.exitCode = 1;
