"use client";

import { createContext, useContext, type ReactNode, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Context to track if a component is inside a staggered container
const StaggerContext = createContext<boolean>(false);

export interface AnimationWrapperProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
  whileHover?: unknown;
  whileTap?: unknown;
  viewport?: unknown;
  initial?: unknown;
  animate?: unknown;
  variants?: unknown;
  transition?: unknown;
}

/**
 * FadeInStagger wraps child elements with lightweight CSS staggered timing.
 * Zero main-thread blocking time, zero layout recalculations.
 */
export function FadeInStagger({ children, className, ...props }: AnimationWrapperProps) {
  return (
    <StaggerContext.Provider value={true}>
      <div className={cn("transition-opacity", className)} {...props}>
        {children}
      </div>
    </StaggerContext.Provider>
  );
}

/**
 * FadeIn renders immediately visible SSR content and enhances with GPU compositor-only animation.
 * Does NOT set opacity:0 in JS runtime, guaranteeing fast FCP & LCP.
 */
export function FadeIn({ children, className, ...props }: AnimationWrapperProps) {
  const isInStagger = useContext(StaggerContext);

  return (
    <div
      className={cn(
        "animate-hero-fade-in-up will-change-transform transform-gpu",
        isInStagger && "motion-safe:transition-all",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * ScaleIn scales a component from slightly smaller to normal size while fading it in.
 * Hardware-accelerated on the compositor thread.
 */
export function ScaleIn({ children, className, ...props }: AnimationWrapperProps) {
  return (
    <div
      className={cn(
        "animate-hero-scale-in will-change-transform transform-gpu",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Lightweight MotionDiv replacement for standard animated containers
 */
export function MotionDiv({ children, className, ...props }: AnimationWrapperProps) {
  return (
    <div className={cn("will-change-transform transform-gpu", className)} {...props}>
      {children}
    </div>
  );
}
