import type { Metadata } from "next";
import {
  CollectionDetailError,
  CollectionDetailPage,
} from "@/components/collection-detail-page";
import { fetchThesisById } from "@/lib/supabase";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { thesis } = await fetchThesisById(id, { visibility: "public" });

  return {
    title: thesis ? `${thesis.title} | Detail Skripsi` : "Skripsi tidak ditemukan",
  };
}

export default async function ThesisDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { thesis, error } = await fetchThesisById(id, { visibility: "public" });

  if (!thesis) {
    return <CollectionDetailError type="thesis" id={id} message={error} />;
  }

  return <CollectionDetailPage item={thesis} />;
}
