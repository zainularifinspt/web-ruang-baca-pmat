import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { VerificationStatus } from "@/lib/types";

type VerificationStore = {
  books?: Record<string, VerificationStatus>;
};

const storePath = path.join(process.cwd(), ".data", "catalog-verifications.json");

export async function readBookVerificationOverrides() {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as VerificationStore;
    return parsed.books ?? {};
  } catch {
    return {};
  }
}

export async function writeBookVerificationOverride(id: string, status: VerificationStatus) {
  const existing = await readBookVerificationOverrides();
  const next: VerificationStore = {
    books: {
      ...existing,
      [id]: status,
    },
  };

  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}
