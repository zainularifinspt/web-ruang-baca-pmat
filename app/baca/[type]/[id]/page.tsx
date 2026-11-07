import { notFound } from "next/navigation";
import { publicCollection } from "@/lib/reader/catalog";
import { getGoogleDriveDirectViewUrl } from "@/lib/google-drive";
import { ReaderApp } from "@/components/reader/reader-app";
export const dynamic = "force-dynamic";
export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ page?: string; v?: string }>;
}) {
  const { type, id } = await params;
  const query = await searchParams;
  if (type !== "buku" && type !== "skripsi") notFound();
  const kind = type === "buku" ? "book" : "thesis";
  const item = await publicCollection(kind, id);
  if (!item) notFound();
  const page = query.page === undefined ? 1 : Number(query.page);
  if (!Number.isInteger(page) || page < 1) notFound();
  return (
    <ReaderApp
      key={`${kind}:${id}`}
      fallbackUrl={
        kind === "book" && item.pdfUrl && /^https:\/\//i.test(item.pdfUrl)
          ? getGoogleDriveDirectViewUrl(item.pdfUrl)
          : undefined
      }
      kind={kind}
      id={id}
      title={item.title}
      author={item.type === "book" ? item.author : item.studentName}
      initialPage={page}
      requestedRevision={query.v}
    />
  );
}
