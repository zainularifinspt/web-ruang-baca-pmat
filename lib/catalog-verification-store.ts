import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { VerificationStatus } from "@/lib/types";

type VerificationStore = {
  books?: Record<string, VerificationStatus>;
};

const bucketName = "ruang-baca-metadata";
const fileName = "catalog-verifications.json";

export async function readBookVerificationOverrides() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(bucketName).download(fileName);

    if (error || !data) return {};

    const parsed = JSON.parse(await data.text()) as VerificationStore;
    return parsed.books ?? {};
  } catch {
    return {};
  }
}

export async function writeBookVerificationOverride(id: string, status: VerificationStatus) {
  await ensureBucket();

  const existing = await readBookVerificationOverrides();
  const next: VerificationStore = {
    books: {
      ...existing,
      [id]: status,
    },
  };

  const supabase = createSupabaseAdminClient();
  const body = new Blob([`${JSON.stringify(next, null, 2)}\n`], {
    type: "application/json",
  });

  const { error } = await supabase.storage.from(bucketName).upload(fileName, body, {
    contentType: "application/json",
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function ensureBucket() {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.getBucket(bucketName);

  if (!error) return;

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: false,
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(createError.message);
  }
}
