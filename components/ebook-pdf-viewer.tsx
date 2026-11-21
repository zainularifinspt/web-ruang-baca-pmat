import Link from "next/link";
import { BookOpen, ArrowUpRight, Search, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
interface EbookPdfViewerProps {
  pdfUrl?: string;
  collectionId?: string;
  title?: string;
  author?: string;
  category?: string;
  className?: string;
}
export function EbookPdfViewer({
  pdfUrl,
  collectionId,
  title = "E-Book",
  className,
}: EbookPdfViewerProps) {
  return (
    <div className={cn("ebook-reader-invitation", className)}>
      <div className="ebook-reader-object" aria-hidden="true">
        <BookOpen size={55} />
      </div>
      <div>
        <h3>Buka ruang baca Anda.</h3>
        <p>
          Baca {title}, temukan pembahasan, dan tanyakan isi dokumen dalam satu
          tempat.
        </p>
        <div className="ebook-reader-features">
          <span>
            <Search size={13} />
            Cari isi
          </span>
          <span>
            <MessageCircle size={13} />
            Tanya buku
          </span>
        </div>
        {pdfUrl && collectionId ? (
          <Link
            href={`/baca/buku/${encodeURIComponent(collectionId)}`}
            className="reader-primary"
          >
            Baca flipbook <ArrowUpRight size={16} />
          </Link>
        ) : (
          <p>File atau identitas dokumen belum tersedia.</p>
        )}
      </div>
    </div>
  );
}
