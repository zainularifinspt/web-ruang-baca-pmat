import { NextResponse } from "next/server";

const DRIVE_HOST = "drive.google.com";
const MAX_PROXY_BYTES = 35 * 1024 * 1024;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const rawPdfUrl = requestUrl.searchParams.get("url");
  const fileId = rawPdfUrl ? extractGoogleDriveFileId(rawPdfUrl) : "";

  if (!fileId) {
    return NextResponse.json({ error: "Link Google Drive PDF tidak valid." }, { status: 400 });
  }

  const downloadUrl = `https://${DRIVE_HOST}/uc?export=download&id=${encodeURIComponent(fileId)}`;
  const response = await fetch(downloadUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    redirect: "follow",
  });

  if (!response.ok || !response.body) {
    return NextResponse.json(
      { error: "File PDF belum dapat diambil dari Google Drive." },
      { status: response.ok ? 502 : response.status },
    );
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PROXY_BYTES) {
    return NextResponse.json(
      { error: "Ukuran PDF terlalu besar untuk viewer." },
      { status: 413 },
    );
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const isPdfLikeResponse =
    !contentType ||
    contentType.includes("pdf") ||
    contentType.includes("application/octet-stream");

  if (!isPdfLikeResponse) {
    return NextResponse.json(
      { error: "Google Drive tidak mengembalikan file PDF langsung." },
      { status: 502 },
    );
  }

  const responseHeaders: Record<string, string> = {
    "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate=86400",
    "Content-Disposition": "inline",
    "Content-Type": "application/pdf",
    "X-Content-Type-Options": "nosniff",
  };

  if (contentLength > 0) {
    responseHeaders["Content-Length"] = String(contentLength);
  }

  return new NextResponse(response.body, {
    headers: responseHeaders,
  });
}

function extractGoogleDriveFileId(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname !== DRIVE_HOST) return "";

    const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (pathMatch?.[1]) return pathMatch[1];

    return url.searchParams.get("id") || "";
  } catch {
    return "";
  }
}
