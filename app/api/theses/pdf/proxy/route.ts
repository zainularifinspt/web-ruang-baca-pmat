import { NextResponse } from "next/server";

const DRIVE_HOST = "drive.google.com";
const MAX_PROXY_BYTES = 35 * 1024 * 1024;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const rawPdfUrl = requestUrl.searchParams.get("url");
  const fileId = rawPdfUrl ? extractGoogleDriveFileId(rawPdfUrl) : "";
  const rangeHeader = getSafeRangeHeader(request.headers.get("range"));

  if (!fileId) {
    return NextResponse.json({ error: "Link Google Drive PDF tidak valid." }, { status: 400 });
  }

  const downloadUrl = `https://${DRIVE_HOST}/uc?export=download&id=${encodeURIComponent(fileId)}`;
  const response = await fetch(downloadUrl, {
    headers: {
      ...(rangeHeader ? { Range: rangeHeader } : {}),
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
  const contentRange = response.headers.get("content-range") ?? "";
  const totalBytes = getContentRangeTotal(contentRange) ?? contentLength;
  if (totalBytes > MAX_PROXY_BYTES) {
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
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate=86400",
    "Content-Disposition": "inline",
    "Content-Type": "application/pdf",
    "Vary": "Range",
    "X-Content-Type-Options": "nosniff",
  };

  if (contentLength > 0) {
    responseHeaders["Content-Length"] = String(contentLength);
  }
  if (contentRange) {
    responseHeaders["Content-Range"] = contentRange;
  }

  return new NextResponse(response.body, {
    status: response.status === 206 ? 206 : 200,
    headers: responseHeaders,
  });
}

function getSafeRangeHeader(value: string | null) {
  if (!value) return "";
  return /^bytes=\d*-\d*(,\d*-\d*)*$/.test(value) ? value : "";
}

function getContentRangeTotal(value: string) {
  const match = value.match(/\/(\d+)$/);
  if (!match?.[1]) return undefined;

  const total = Number(match[1]);
  return Number.isFinite(total) ? total : undefined;
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
