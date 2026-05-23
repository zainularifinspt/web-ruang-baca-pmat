import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { CollectionBase, VerificationStatus } from "@/lib/types";

export type CatalogInputAudit = {
  source: CollectionBase["inputSource"];
  inputBy: string;
};

export type ThesisPdfMetadata = {
  url: string;
  filename?: string;
  size?: number;
};

type VerificationStore = {
  books?: Record<string, VerificationStatus>;
  theses?: Record<string, VerificationStatus>;
  inputs?: Record<string, CatalogInputAudit>;
  thesisPdfs?: Record<string, ThesisPdfMetadata>;
};

const bucketName = "ruang-baca-metadata";
const fileName = "catalog-verifications.json";

export async function readBookVerificationOverrides() {
  const store = await readVerificationStore();
  return store.books ?? {};
}

export async function readThesisVerificationOverrides() {
  const store = await readVerificationStore();
  return store.theses ?? {};
}

export async function readCatalogInputOverrides() {
  const store = await readVerificationStore();
  return store.inputs ?? {};
}

export async function readThesisPdfOverrides() {
  const store = await readVerificationStore();
  return store.thesisPdfs ?? {};
}

async function readVerificationStore() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(bucketName).download(fileName);

    if (error || !data) return {} as VerificationStore;

    return JSON.parse(await data.text()) as VerificationStore;
  } catch {
    return {} as VerificationStore;
  }
}

export async function writeBookVerificationOverride(id: string, status: VerificationStatus) {
  await writeVerificationOverride("books", id, status);
}

export async function writeThesisVerificationOverride(id: string, status: VerificationStatus) {
  await writeVerificationOverride("theses", id, status);
}

export async function writeCatalogInputOverride(
  type: "book" | "thesis",
  id: string,
  audit: CatalogInputAudit,
) {
  await ensureBucket();

  const existing = await readVerificationStore();
  const key = `${type}:${id}`;
  const next: VerificationStore = {
    ...existing,
    inputs: {
      ...(existing.inputs ?? {}),
      [key]: audit,
    },
  };

  await writeVerificationStore(next);
}

export async function writeThesisPdfOverride(id: string, metadata: ThesisPdfMetadata) {
  await ensureBucket();

  const existing = await readVerificationStore();
  const next: VerificationStore = {
    ...existing,
    thesisPdfs: {
      ...(existing.thesisPdfs ?? {}),
      [id]: metadata,
    },
  };

  await writeVerificationStore(next);
}

async function writeVerificationOverride(
  type: "books" | "theses",
  id: string,
  status: VerificationStatus,
) {
  await ensureBucket();

  const existing = await readVerificationStore();
  const next: VerificationStore = {
    ...existing,
    [type]: {
      ...(existing[type] ?? {}),
      [id]: status,
    },
  };

  await writeVerificationStore(next);
}

async function writeVerificationStore(next: VerificationStore) {
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
