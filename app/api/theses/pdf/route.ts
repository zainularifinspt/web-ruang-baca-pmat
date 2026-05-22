import { NextResponse } from "next/server";
import { requireStaffRole } from "@/lib/auth-guards";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const PDF_BUCKET = "skripsi-pdf";
const MAX_PDF_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireStaffRole(["admin", "petugas"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File PDF wajib dipilih." }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "File harus berformat PDF." }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Ekstensi file harus .pdf." }, { status: 400 });
  }

  if (file.size > MAX_PDF_SIZE) {
    return NextResponse.json({ error: "Ukuran file PDF maksimal 5 MB." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `${auth.user.id}/${Date.now()}-${safeFilename}`;
  const { error } = await supabase.storage.from(PDF_BUCKET).upload(storagePath, file, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message.includes("Bucket not found")
            ? "Bucket skripsi-pdf belum tersedia. Jalankan migration atau buat bucket sesuai dokumentasi."
            : error.message,
      },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PDF_BUCKET).getPublicUrl(storagePath);

  return NextResponse.json({
    pdfUrl: publicUrl,
    pdfFilename: file.name,
    pdfSize: file.size,
  });
}
