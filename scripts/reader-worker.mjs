import { createRequire } from "node:module";
import {
  mkdir,
  readdir,
  readFile,
  writeFile,
  rename,
  rm,
} from "node:fs/promises";
import { resolve, join } from "node:path";
import { spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
const require = createRequire(import.meta.url);
require("@next/env").loadEnvConfig(process.cwd());
const mode = process.env.READER_STORAGE || "local";
const dir = resolve(process.env.READER_DATA_DIR || ".reader-data", "jobs");
await mkdir(dir, { recursive: true });
const db =
  mode === "local"
    ? null
    : createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );
console.log("Worker dokumen aktif. Menunggu antrean…");
let running = true;
process.on("SIGTERM", () => (running = false));
process.on("SIGINT", () => (running = false));
while (running) {
  let job = null;
  let lock = null;
  try {
    if (db) {
      const { data, error } = await db.rpc("reader_claim_job");
      if (error) throw error;
      job = data?.[0] || null;
    } else
      for (const f of await readdir(dir)) {
        if (!f.endsWith(".json")) continue;
        const path = join(dir, f);
        const j = JSON.parse(await readFile(path, "utf8"));
        if (j.status !== "queued") continue;
        lock = path + ".lock";
        try {
          await mkdir(lock);
        } catch {
          continue;
        }
        job = { ...j, status: "processing" };
        await writeFile(path, JSON.stringify(job));
        break;
      }
    if (job) {
      const key = job.document_id;
      const kind = key.startsWith("book-") ? "book" : "thesis";
      const id = key.slice(kind.length + 1);
      if (!/^[a-zA-Z0-9_-]{1,160}$/.test(id))
        throw Error("Identitas tugas tidak valid.");
      const code = await new Promise((ok, no) => {
        const p = spawn(
          process.execPath,
          [
            "--experimental-strip-types",
            "scripts/reader-index.mjs",
            "--storage",
            mode,
            "--kind",
            kind,
            "--id",
            id,
            "--job-id",
            job.id,
          ],
          { stdio: "inherit" },
        );
        p.on("error", no);
        p.on("close", ok);
      });
      if (!db)
        await writeFile(
          join(dir, job.id + ".tmp"),
          JSON.stringify({
            ...job,
            status: code === 0 ? "ready" : "failed",
            updated_at: new Date().toISOString(),
          }),
        ).then(() =>
          rename(join(dir, job.id + ".tmp"), join(dir, job.id + ".json")),
        );
    }
  } catch (error) {
    console.error(
      "Worker:",
      error instanceof Error ? error.message : "Antrean belum tersedia.",
    );
    if (job && db)
      await db
        .from("reader_jobs")
        .update({
          status: "failed",
          message: "Pemrosesan gagal; periksa worker.",
        })
        .eq("id", job.id);
  } finally {
    if (lock) await rm(lock, { recursive: true, force: true });
  }
  if (!job) await new Promise((r) => setTimeout(r, 5000));
}
