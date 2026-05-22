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
  
  // Ensure bucket exists
  const { data: existingBucket } = await supabase.storage.getBucket(PDF_BUCKET);
  if (!existingBucket) {
    const { error: createBucketError } = await supabase.storage.createBucket(PDF_BUCKET, {
      public: true,
      fileSizeLimit: MAX_PDF_SIZE,
      allowedMimeTypes: ["application/pdf"],
    });
    
    if (createBucketError && !createBucketError.message.includes("already exists")) {
      return NextResponse.json(
        { error: `Gagal membuat bucket: ${createBucketError.message}` },
        { status: 500 },
      );
    }
  }

  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `${auth.user.id}/${Date.now()}-${safeFilename}`;
  const { error } = await supabase.storage.from(PDF_BUCKET).upload(storagePath, file, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (error) {
    return NextResponse.json(
      { error: `Gagal mengupload file: ${error.message}` },
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
