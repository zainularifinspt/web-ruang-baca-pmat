import { notFound, redirect } from "next/navigation";
import { publicCollection } from "@/lib/reader/catalog";
import { readerUrl } from "@/lib/reader/core";
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
  if (type === "skripsi") redirect(readerUrl("thesis", id));
  if (type !== "buku") notFound();
  const query = await searchParams;
  const item = await publicCollection("book", id);
  if (item?.type !== "book") notFound();
  const page = query.page === undefined ? 1 : Number(query.page);
  if (!Number.isInteger(page) || page < 1) notFound();
  return (
    <ReaderApp
      key={`book:${id}`}
      fallbackUrl={
        item.pdfUrl && /^https:\/\//i.test(item.pdfUrl)
          ? getGoogleDriveDirectViewUrl(item.pdfUrl)
          : undefined
      }
      kind="book"
      id={id}
      title={item.title}
      author={item.author}
      initialPage={page}
      requestedRevision={query.v}
    />
  );
}
