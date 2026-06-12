import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 p-10 text-center shadow-sm backdrop-blur",
        className,
      )}
    >
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-red-50 to-yellow-50 p-3 text-red-700 shadow-sm ring-1 ring-red-100">
        <SearchX className="size-6" />
      </div>
      <h3 className="text-lg font-bold tracking-tight text-slate-950">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
