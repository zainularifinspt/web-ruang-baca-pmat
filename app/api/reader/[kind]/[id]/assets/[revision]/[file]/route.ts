import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getReaderDocument, dataRoot, readerLocal } from "@/lib/reader/store";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      kind: string;
      id: string;
      revision: string;
      file: string;
    }>;
  },
) {
  try {
    const { kind, id, revision, file } = await params;
    if (
      (kind !== "book" && kind !== "thesis") ||
      !/^\d+-(read|thumb|hd)\.webp$/.test(file)
    )
      return new NextResponse(null, { status: 404 });
    const doc = await getReaderDocument(kind, id);
    if (
      !doc ||
      doc.revision !== revision ||
      !doc.pages.some((p) => [p.image, p.thumbnail, p.hd].includes(file))
    )
      return new NextResponse(null, { status: 404 });
    let bytes: Uint8Array;
    if (readerLocal())
      bytes = await readFile(path.join(dataRoot(), doc.key, revision, file));
    else if (process.env.READER_STORAGE === "r2") {
      const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
      const s3 = new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });
      const object = await s3.send(
        new GetObjectCommand({
          Bucket: process.env.R2_READER_BUCKET,
          Key: `${doc.key}/${revision}/${file}`,
        }),
      );
      bytes = await object.Body!.transformToByteArray();
    } else {
      const { data, error } = await createSupabaseAdminClient()
        .storage.from(process.env.READER_ASSET_BUCKET || "reader-assets")
        .download(`${doc.key}/${revision}/${file}`);
      if (error || !data) throw Error();
      bytes = new Uint8Array(await data.arrayBuffer());
    }
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
