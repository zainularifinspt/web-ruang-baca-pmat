"use client";

import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  coverUrl?: string;
  title: string;
  author?: string;
  category?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function BookCover({
  coverUrl,
  title,
  className,
  size = "md",
}: BookCoverProps) {
  const sizeClasses = {
    sm: "w-11 h-15 rounded-lg",
    md: "w-13 h-19 sm:w-15 sm:h-22 rounded-xl",
    lg: "w-44 h-64 rounded-2xl",
    xl: "w-56 h-80 rounded-[1.5rem]",
  };

  if (coverUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-slate-100 shadow-sm ring-1 ring-slate-200/90 transition-all duration-300",
          sizeClasses[size],
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={`Cover ${title}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative shrink-0 select-none overflow-hidden shadow-xs ring-1 ring-slate-200 bg-slate-100 flex flex-col justify-center items-center p-2 text-slate-400 text-center",
        sizeClasses[size],
        className,
      )}
    >
      <BookOpen className="size-6 text-slate-400 mb-1" />
      <span className="line-clamp-2 text-[9px] font-semibold text-slate-500">{title}</span>
    </div>
  );
}
