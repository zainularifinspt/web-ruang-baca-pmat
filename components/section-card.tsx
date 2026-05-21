import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("rounded-3xl border-white/80 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur", className)}>
      {title || description || action ? (
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100/80 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <CardTitle className="text-lg font-bold tracking-tight text-slate-950">{title}</CardTitle> : null}
            {description ? (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {action ? (
            <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
              {action}
            </div>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn(title || description || action ? "pt-5" : "", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
