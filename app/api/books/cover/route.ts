import { NextResponse } from "next/server";
import { requireStaffRole } from "@/lib/auth-guards";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const COVER_BUCKET = "book-covers";
const MAX_COVER_SIZE = 1536 * 1024;
const allowedCoverTypes = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const auth = await requireStaffRole(["admin", "petugas"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File cover buku wajib dipilih." }, { status: 400 });
  }

  if (!allowedCoverTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Cover buku harus berupa gambar JPG, PNG, atau WebP." },
      { status: 400 },
    );
  }

  if (file.size > MAX_COVER_SIZE) {
    return NextResponse.json(
      { error: "Ukuran cover setelah kompresi maksimal 1.5 MB." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: existingBucket } = await supabase.storage.getBucket(COVER_BUCKET);

  if (!existingBucket) {
    const { error: createBucketError } = await supabase.storage.createBucket(COVER_BUCKET, {
      public: true,
      fileSizeLimit: MAX_COVER_SIZE,
      allowedMimeTypes: allowedCoverTypes,
    });

    if (createBucketError && !createBucketError.message.includes("already exists")) {
      return NextResponse.json(
        { error: `Gagal membuat bucket cover: ${createBucketError.message}` },
        { status: 500 },
      );
    }
  } else if (!existingBucket.public) {
    const { error: updateBucketError } = await supabase.storage.updateBucket(COVER_BUCKET, {
      public: true,
      fileSizeLimit: MAX_COVER_SIZE,
      allowedMimeTypes: allowedCoverTypes,
    });

    if (updateBucketError) {
      return NextResponse.json(
        { error: `Gagal mengaktifkan akses publik bucket cover: ${updateBucketError.message}` },
        { status: 500 },
      );
    }
  }

  const extension = extensionFromMimeType(file.type);
  const safeFilename = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `${auth.user.id}/${Date.now()}-${safeFilename || "cover"}.${extension}`;
  const { error } = await supabase.storage.from(COVER_BUCKET).upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json(
      { error: `Gagal mengupload cover buku: ${error.message}` },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(COVER_BUCKET).getPublicUrl(storagePath);

  return NextResponse.json({
    coverUrl: publicUrl,
    coverPath: storagePath,
    coverFilename: file.name,
    coverSize: file.size,
  });
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}
