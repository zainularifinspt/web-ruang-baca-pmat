import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchCollectionById } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  const item = await fetchCollectionById(type, id);

  if (!item) notFound();

  const isBook = item.type === "book";

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Button asChild variant="outline" size="sm" className="mb-6 rounded-xl bg-white">
          <Link href="/katalog">
            <ArrowLeft />
            Kembali ke katalog
          </Link>
        </Button>
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{isBook ? "Buku" : "Skripsi"}</Badge>
              <StatusBadge status={item.verificationStatus} />
            </div>
            <CardTitle className="text-xl leading-tight sm:text-2xl">{item.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <Meta label={isBook ? "Penulis" : "Mahasiswa"} value={isBook ? item.author : item.authorName} />
              <Meta label="Tahun" value={String(item.year)} />
              <Meta label="Kode" value={item.code} />
              <Meta label="Lokasi" value={item.location} />
              <Meta label="Sumber input" value={item.inputSource} />
              <Meta label="Diinput oleh" value={item.inputBy} />
              <Meta label="Tanggal input" value={formatDate(item.createdAt)} />
              <Meta label="Kata kunci" value={item.keywords.join(", ")} />
            </div>
            {isBook ? (
              <div className="grid gap-3 rounded-2xl border bg-muted/35 p-4 sm:grid-cols-2">
                <Meta label="Penerbit" value={item.publisher} />
                <Meta label="Kategori" value={item.category} />
                <Meta label="ISBN" value={item.isbn} />
                <Meta label="Stok" value={`${item.available} tersedia dari ${item.stock}`} />
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl border bg-muted/35 p-4">
                <Meta label="Pembimbing 1" value={item.supervisor1} />
                <Meta label="Pembimbing 2" value={item.supervisor2} />
                <Meta label="Tahun lulus" value={String(item.graduationYear)} />
                <p className="leading-6 text-muted-foreground">{item.abstract}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-medium text-foreground">{label}:</span>{" "}
      <span className="text-muted-foreground">{value}</span>
    </p>
  );
}
