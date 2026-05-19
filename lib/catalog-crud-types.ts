import type { VerificationStatus } from "@/lib/types";

export type CatalogActionResult = {
  ok: boolean;
  message: string;
};

export type BookFormValues = {
  title: string;
  author: string;
  category: string;
  location: string;
  stock: number;
  status: VerificationStatus;
};

export type ThesisFormValues = {
  title: string;
  authorName: string;
  year: number;
  topic: string;
  abstract: string;
  supervisor1: string;
  supervisor2: string;
  verificationStatus: VerificationStatus;
};
