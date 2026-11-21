import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
const require = createRequire(import.meta.url);
require("@next/env").loadEnvConfig(process.cwd());
const mode = process.env.READER_STORAGE || "local";
const python = spawnSync(process.env.READER_PYTHON || "python3", [
  "-c",
  "import pymupdf;import PIL",
]);
const checks = {
  storage: mode,
  node: process.versions.node,
  pdfProcessor: python.status === 0,
  ocr: spawnSync("tesseract", ["--version"]).status === 0,
  deepseekConfigured: Boolean(process.env.DEEPSEEK_API_KEY),
  signedSessionConfigured: (process.env.CHAT_SESSION_SECRET || "").length >= 32,
  embeddingService: false,
  database: false,
  localDocuments: 0,
};
if (process.env.READER_EMBEDDING_URL)
  try {
    const r = await fetch(process.env.READER_EMBEDDING_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.READER_EMBEDDING_KEY
          ? { Authorization: `Bearer ${process.env.READER_EMBEDDING_KEY}` }
          : {}),
      },
      body: JSON.stringify({ texts: ["query: metode penelitian"] }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await r.json();
    checks.embeddingService = r.ok && data.embeddings?.[0]?.length === 384;
  } catch {}
if (mode === "local") {
  const dir = resolve(process.env.READER_DATA_DIR || ".reader-data");
  for (const name of await readdir(dir).catch(() => []))
    try {
      const d = JSON.parse(
        await readFile(join(dir, name, "document.json"), "utf8"),
      );
      if (d.pages?.length) checks.localDocuments++;
    } catch {}
} else if (
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
    const { error } = await db.from("reader_documents").select("id").limit(1);
    checks.database = !error;
  } catch {}
console.log(JSON.stringify(checks, null, 2));
if (
  !checks.pdfProcessor ||
  (mode !== "local" && (!checks.database || !checks.signedSessionConfigured))
)
  process.exitCode = 1;
