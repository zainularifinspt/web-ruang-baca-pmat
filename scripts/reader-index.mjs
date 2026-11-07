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
const all = new Map();
for (let offset = 0; offset < 100000; offset += 500) {
  const res = await fetch(
    `${base.replace(/\/$/, "")}/api/catalog?visibility=public&limit=500&offset=${offset}`,
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
const items = [...all.values()]
  .filter(
    (x) =>
      x.type === kind &&
      hasVerifiedCatalogSource(x) &&
      (x.pdfR2 || x.pdfUrl) &&
      (!wanted || x.id === wanted) &&
      !/^ebk-\d+$/.test(x.id),
  )
  .slice(0, args.includes("--all") ? undefined : limit);
if (!items.length)
  throw Error(
    "Tidak ada dokumen dengan sumber dan identitas stabil yang cocok.",
  );
let failures = 0;
async function runPython(file, dir, type) {
  await new Promise((ok, no) => {
    const child = spawn(
      process.env.READER_PYTHON || "python3",
      ["scripts/reader-extract.py", file, dir, "--kind", type],
      { stdio: "inherit" },
    );
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      no(Error("Pemrosesan melewati 10 menit."));
    }, 600000);
    child.on("error", no);
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) ok();
      else no(Error("Pemrosesan PDF gagal; lihat pesan di atas."));
    });
  });
}
async function embed(texts) {
  if (!process.env.READER_EMBEDDING_URL) return null;
  const res = await fetch(process.env.READER_EMBEDDING_URL, {
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
for (const item of items) {
  const key = readerKey(item.type, item.id);
  const job = option("--job-id", randomUUID());
  const work = join(root, `.work-${job}`);
  try {
    if (db)
      await db
        .from("reader_jobs")
        .upsert({ id: job, document_id: key, status: "processing" });
    const sourceUrl = (item.pdfR2 || item.pdfUrl).trim();
    console.log(`Memproses ${item.type} ${item.id}`);
    const data = await downloadPdf(sourceUrl);
    const hash = createHash("sha256").update(data).digest("hex");
    const revision = createHash("sha256")
      .update(
        hash +
          READER_POLICY +
          "render-v2" +
          (process.env.READER_EMBEDDING_MODEL || "none") +
          (args.includes("--force") ? job : ""),
      )
      .digest("hex")
      .slice(0, 20);
    const current = await readFile(join(root, key, "document.json"), "utf8")
      .then(JSON.parse)
      .catch(() => null);
    if (
      mode === "local" &&
      current?.revision === revision &&
      current.sourceUrl === sourceUrl &&
      !args.includes("--force")
    ) {
      console.log("Versi sudah siap; dilewati.");
      if (db)
        await db
          .from("reader_jobs")
          .update({
            status: "ready",
            progress: 100,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job);
      continue;
    }
    await mkdir(work, { recursive: true });
    const pdf = join(work, "source.pdf");
    await writeFile(pdf, data);
    await runPython(pdf, work, item.type);
    const parsed = JSON.parse(
      await readFile(join(work, "extracted.json"), "utf8"),
    );
    const chunks = chunkPages(parsed.pages);
    let embeddingReady = false;
    if (process.env.READER_EMBEDDING_URL) {
      for (let i = 0; i < chunks.length; i += 16) {
        const vectors = await embed(chunks.slice(i, i + 16).map((c) => c.text));
        vectors?.forEach((v, j) => (chunks[i + j].embedding = v));
      }
      embeddingReady = true;
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
      embeddingModel: embeddingReady
        ? process.env.READER_EMBEDDING_MODEL || "Xenova/multilingual-e5-small"
        : undefined,
    };
    // Originals and hidden page material never enter the asset directory.
    await rm(pdf);
    await rm(join(work, "extracted.json"));
    if (db) {
      const bucket = process.env.READER_ASSET_BUCKET || "reader-assets";
      if (mode === "r2") {
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
      } else {
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
      const check = async (promise) => {
        const r = await promise;
        if (r.error) throw r.error;
        return r.data;
      };
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
      for (let i = 0; i < doc.pages.length; i += 20)
        await check(
          db.from("reader_pages").upsert(
            doc.pages.slice(i, i + 20).map((p) => ({
              document_id: key,
              revision,
              page_number: p.number,
              label: p.label,
              width: p.width,
              height: p.height,
              text_content: p.text,
              image: p.image,
              thumbnail: p.thumbnail,
              hd: p.hd,
              words: p.words,
              quality: p.quality,
            })),
          ),
        );
      for (let i = 0; i < chunks.length; i += 50)
        await check(
          db.from("reader_chunks").upsert(
            chunks.slice(i, i + 50).map((c) => ({
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
    const destination = join(root, key, revision);
    await mkdir(destination, { recursive: true });
    for (const p of doc.pages)
      for (const f of [p.image, p.thumbnail, p.hd])
        await copyFile(join(work, f), join(destination, f));
    await writeFile(
      join(root, key, "document.pending.json"),
      JSON.stringify(doc),
    );
    await rename(
      join(root, key, "document.pending.json"),
      join(root, key, "document.json"),
    );
    console.log(
      `Siap: ${doc.pages.length} halaman, ${chunks.length} potongan, embedding ${embeddingReady ? "aktif" : "belum diaktifkan"}.`,
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
if (failures) process.exitCode = 1;
