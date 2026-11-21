import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { requireStaffRole } from "@/lib/auth-guards";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { readerLocal, dataRoot, readLocalDocument } from "@/lib/reader/store";
import { readerKey } from "@/lib/reader/core";
import { publicCollection } from "@/lib/reader/catalog";
export async function GET() {
  const auth = await requireStaffRole(["admin"]);
  if (!auth.ok)
    return NextResponse.json({ error: auth.message }, { status: 403 });
  try {
    if (readerLocal()) {
      const files = await readdir(dataRoot()).catch(() => []);
      const docs = [];
      for (const f of files) {
        const d = await readLocalDocument(f);
        if (d)
          docs.push({
            id: d.key,
            title: d.title,
            pages: d.pages.length,
            textPages: d.pages.filter((p) => p.quality !== "image").length,
            ready: true,
          });
      }
      const jobsDir = path.join(dataRoot(), "jobs");
      const jobs = [];
      for (const f of await readdir(jobsDir).catch(() => [])) {
        if (f.endsWith(".json"))
          jobs.push(JSON.parse(await readFile(path.join(jobsDir, f), "utf8")));
      }
      return NextResponse.json(
        {
          documents: docs,
          jobs,
          aiReady: Boolean(process.env.DEEPSEEK_API_KEY),
          storage: "local",
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const db = createSupabaseAdminClient();
    const [{ data: documents, error }, { data: jobs }] = await Promise.all([
      db
        .from("reader_documents")
        .select("id,title,is_public,active_revision")
        .order("updated_at", { ascending: false })
        .limit(300),
      db
        .from("reader_jobs")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(50),
    ]);
    if (error) throw Error();
    return NextResponse.json(
      {
        documents: (documents || []).map((d) => ({
          ...d,
          ready: d.is_public && Boolean(d.active_revision),
        })),
        jobs: jobs || [],
        aiReady: Boolean(process.env.DEEPSEEK_API_KEY),
        storage: process.env.READER_STORAGE || "supabase",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Penyimpanan dokumen belum diaktifkan." },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  const auth = await requireStaffRole(["admin"]);
  if (!auth.ok)
    return NextResponse.json({ error: auth.message }, { status: 403 });
  try {
    if (Number(request.headers.get("content-length")) > 2000)
      return NextResponse.json(
        { error: "Permintaan terlalu besar." },
        { status: 413 },
      );
    const { kind, id } = await request.json();
    if (!["book", "thesis"].includes(kind) || typeof id !== "string")
      return NextResponse.json(
        { error: "Koleksi tidak valid." },
        { status: 400 },
      );
    const key = readerKey(kind, id);
    const item = await publicCollection(kind, id);
    if (!item || !(item.pdfUrl || ("pdfR2" in item && item.pdfR2)))
      return NextResponse.json(
        { error: "Koleksi publik dengan PDF tidak ditemukan." },
        { status: 404 },
      );
    const job = {
      id: randomUUID(),
      document_id: key,
      status: "queued",
      progress: 0,
      updated_at: new Date().toISOString(),
    };
    if (readerLocal()) {
      const dir = path.join(dataRoot(), "jobs");
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, job.id + ".tmp"), JSON.stringify(job));
      await rename(
        path.join(dir, job.id + ".tmp"),
        path.join(dir, job.id + ".json"),
      );
    } else {
      const { error } = await createSupabaseAdminClient()
        .from("reader_jobs")
        .insert(job);
      if (error) throw Error();
    }
    return NextResponse.json(
      { message: "Dokumen masuk antrean pemrosesan.", jobId: job.id },
      { status: 202 },
    );
  } catch {
    return NextResponse.json(
      { error: "Dokumen belum dapat dimasukkan ke antrean." },
      { status: 503 },
    );
  }
}
