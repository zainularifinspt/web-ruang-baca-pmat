import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export {
  Table as DataTable,
  TableBody as DataTableBody,
  TableCell as DataTableCell,
  TableHead as DataTableHead,
  TableHeader as DataTableHeader,
  TableRow as DataTableRow,
};

export function InitialAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initial = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-amber-100 text-sm font-bold text-red-800",
        className,
      )}
    >
      {initial}
    </span>
  );
}
