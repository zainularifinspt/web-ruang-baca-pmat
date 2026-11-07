import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminGlassGeometry() {
  return (
    <div className="admin-geometry" aria-hidden="true">
      {["rose", "violet", "amber"].map((tone) => (
        <div key={tone} className={`admin-cube-position cube-${tone}`}>
          <div className="admin-cube">
            {["front", "back", "right", "left", "top", "bottom"].map((face) => (
              <span key={face} className={`cube-face face-${face}`} />
            ))}
          </div>
        </div>
      ))}
      <span className="admin-orbit orbit-one" />
      <span className="admin-orbit orbit-two" />
    </div>
  );
}

export function AdminPageHeading({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("admin-page-heading", className)}>
      <div className="relative z-10 max-w-2xl">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {children}
      </div>
      <AdminGlassGeometry />
    </section>
  );
}
