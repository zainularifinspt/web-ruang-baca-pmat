import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { VerificationStatus } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

// Mapping antara nilai UI (Bahasa Indonesia) dan nilai Supabase (English)
const verificationStatusUIMap: Record<VerificationStatus, string> = {
  pending: "Menunggu Verifikasi",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const verificationStatusValueMap: Record<string, VerificationStatus> = {
  "Menunggu Verifikasi": "pending",
  Disetujui: "approved",
  Ditolak: "rejected",
};

// Konversi dari label UI ke nilai Supabase
export function uiStatusToValue(uiLabel: string): VerificationStatus {
  return verificationStatusValueMap[uiLabel] || "pending";
}

// Konversi dari nilai Supabase ke label UI
export function valueToUIStatus(value: VerificationStatus): string {
  return verificationStatusUIMap[value] || "Menunggu Verifikasi";
}

// Dapatkan semua label UI untuk dropdown
export function getAllVerificationStatusLabels(): string[] {
  return Object.keys(verificationStatusValueMap);
}
