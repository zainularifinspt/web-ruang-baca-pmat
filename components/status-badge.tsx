import { verificationTone } from "@/lib/mock-data";
import type { VerificationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: VerificationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        verificationTone[status],
      )}
    >
      {status}
    </span>
  );
}

export function AvailabilityBadge({
  available,
  stock,
}: {
  available: number;
  stock: number;
}) {
  const label =
    available <= 0 ? "Tidak tersedia" : available <= Math.max(1, stock / 2) ? "Terbatas" : "Tersedia";
  const tone =
    available <= 0
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : label === "Terbatas"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", tone)}>
      {label} {available}/{stock}
    </span>
  );
}
