import type { BookStatus, VerificationStatus } from "@/lib/types";

export type { BookStatus };

export type CatalogActionResult = {
  ok: boolean;
  message: string;
};

export type BookFormValues = {
  title: string;
  author: string;
  category: string;
  rackLocation: string;
  stock: number;
  status: BookStatus;
  coverUrl: string;
};

export type ThesisFormValues = {
  title: string;
  studentName: string;
  year: number;
  topic: string;
  abstract: string;
  supervisor1: string;
  supervisor2: string;
  coverUrl: string;
  physicalLocation: string;
  accessNote: string;
  verificationStatus: VerificationStatus;
};
