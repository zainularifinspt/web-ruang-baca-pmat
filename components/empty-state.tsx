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
        "flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm",
        className,
      )}
    >
      <div className="mb-4 rounded-2xl bg-emerald-50 p-3 text-emerald-700 ring-1 ring-emerald-100">
        <SearchX className="size-6" />
      </div>
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
