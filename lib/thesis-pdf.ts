const THESIS_PDF_BUCKET = "skripsi-pdf";

export function resolveThesisPdfUrl(pdfUrl?: string | null) {
  const trimmedUrl = pdfUrl?.trim();
  if (!trimmedUrl) return undefined;

  if (/^(https?:)?\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  if (!supabaseUrl) {
    return trimmedUrl;
  }

  const storagePublicPrefix = `storage/v1/object/public/${THESIS_PDF_BUCKET}/`;
  const bucketPrefix = `${THESIS_PDF_BUCKET}/`;
  let storagePath = trimmedUrl.replace(/^\/+/, "");

  if (storagePath.startsWith(storagePublicPrefix)) {
    storagePath = storagePath.slice(storagePublicPrefix.length);
  }

  if (storagePath.startsWith(bucketPrefix)) {
    storagePath = storagePath.slice(bucketPrefix.length);
  }

  const encodedPath = storagePath
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");

  return `${supabaseUrl}/storage/v1/object/public/${THESIS_PDF_BUCKET}/${encodedPath}`;
}
