/**
 * Utilitas untuk mengolah link Google Drive, ekstraksi File ID,
 * pembuatan URL preview iframe, direct download, dan thumbnail cover.
 */

export function extractGoogleDriveFileId(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();

  // Pola 1: /file/d/{ID} atau /document/d/{ID} atau /presentation/d/{ID}
  const matchPath = trimmed.match(/\/(?:file|document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]+)/);
  if (matchPath?.[1]) return matchPath[1];

  // Pola 2: ?id={ID} atau &id={ID}
  const matchParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchParam?.[1]) return matchParam[1];

  // Pola 3: /d/{ID}
  const matchShort = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchShort?.[1]) return matchShort[1];

  // Pola 4: Direct ID string (biasanya 25-45 alphanumeric chars)
  if (/^[a-zA-Z0-9_-]{25,45}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function isGoogleDriveUrl(url?: string | null): boolean {
  if (!url) return false;
  return Boolean(
    url.includes("drive.google.com") ||
      url.includes("docs.google.com") ||
      extractGoogleDriveFileId(url),
  );
}

/**
 * Menghasilkan URL untuk disematkan dalam iframe viewer
 */
export function getGoogleDrivePreviewUrl(url?: string | null): string {
  if (!url) return "";

  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  // Jika URL PDF umum, gunakan Google Docs Viewer
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  }

  return url;
}

/**
 * Menghasilkan direct download link Google Drive
 */
export function getGoogleDriveDownloadUrl(url?: string | null): string {
  if (!url) return "";

  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return url;
}

/**
 * Menghasilkan link Google Drive untuk dibuka di tab baru
 */
export function getGoogleDriveDirectViewUrl(url?: string | null): string {
  if (!url) return "";

  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  }

  return url;
}

/**
 * Menghasilkan URL thumbnail berkecepatan tinggi dari Google Drive
 * Format lh3.googleusercontent.com/d/ID=w{width} dan drive.google.com/thumbnail
 * sangat stabil dan tahan batas kuota Google Drive.
 */
export function getGoogleDriveThumbnailUrl(url?: string | null, width = 600): string {
  if (!url) return "";

  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}=w${width}`;
  }

  return url;
}
