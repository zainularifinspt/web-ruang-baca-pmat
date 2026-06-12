import type { VerificationStatus } from "@/lib/types";
import { cn, valueToUIStatus } from "@/lib/utils";

const verificationTone: Record<VerificationStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-red-50 text-red-700 border-red-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

export function StatusBadge({ status }: { status: VerificationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm",
        verificationTone[status],
      )}
    >
      {valueToUIStatus(status)}
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
      ? "border-rose-200 bg-rose-50 text-rose-700 shadow-sm"
      : label === "Terbatas"
        ? "border-amber-200 bg-amber-50 text-amber-700 shadow-sm"
        : "border-red-200 bg-red-50 text-red-700 shadow-sm";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", tone)}>
      {label} {available}/{stock}
    </span>
  );
}
