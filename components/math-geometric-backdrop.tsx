"use client";

import React from "react";
import dynamic from "next/dynamic";

const DesktopPolyhedronsBackdrop = dynamic(
  () => import("./desktop-polyhedrons").then((mod) => mod.DesktopPolyhedronsBackdrop),
  { ssr: false }
);

export function MathGeometricBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Mathematical Polar Coordinate Rings & Vector Mesh (Deep Background) */}
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] sm:w-[1200px] h-[600px] sm:h-[800px] opacity-20"
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="coordGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#fb7185" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#be123c" stopOpacity="0.05" />
          </linearGradient>
          <radialGradient id="meshRadial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#be123c" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Polar Circles */}
        <circle cx="600" cy="400" r="120" stroke="url(#coordGrad)" strokeWidth="0.8" strokeDasharray="3 4" />
        <circle cx="600" cy="400" r="220" stroke="url(#coordGrad)" strokeWidth="0.9" strokeDasharray="4 6" />
        <circle cx="600" cy="400" r="340" stroke="url(#coordGrad)" strokeWidth="0.75" />
        <circle cx="600" cy="400" r="480" stroke="url(#coordGrad)" strokeWidth="0.6" strokeDasharray="5 7" />

        {/* Coordinate Radials */}
        <line x1="120" y1="400" x2="1080" y2="400" stroke="url(#coordGrad)" strokeWidth="0.6" strokeDasharray="6 8" />
        <line x1="600" y1="80" x2="600" y2="720" stroke="url(#coordGrad)" strokeWidth="0.6" strokeDasharray="6 8" />
        <line x1="260" y1="160" x2="940" y2="640" stroke="url(#coordGrad)" strokeWidth="0.5" strokeDasharray="3 6" />
        <line x1="260" y1="640" x2="940" y2="160" stroke="url(#coordGrad)" strokeWidth="0.5" strokeDasharray="3 6" />

        {/* Hyperbolic Curves */}
        <path
          d="M200,220 Q600,380 1000,220"
          stroke="url(#coordGrad)"
          strokeWidth="0.8"
          strokeDasharray="4 4"
        />
        <path
          d="M200,580 Q600,420 1000,580"
          stroke="url(#coordGrad)"
          strokeWidth="0.8"
          strokeDasharray="4 4"
        />
      </svg>

      {/* 2. Interactive 3D Rotating Polyhedrons (Desktop Only, Code-Split) */}
      <DesktopPolyhedronsBackdrop />

      {/* 3. Floating 3D Glass Math Badges (Elegantly Scattered with Translucent Depth) */}
      {/* Integral Badge (Top Left Near Header) */}
      <div className="pointer-events-auto hidden md:block absolute top-28 left-[22%] animate-[float-slow_7s_ease-in-out_infinite] opacity-55 sm:opacity-75 hover:opacity-100 transition-all duration-300">
        <MathGlassBadge symbol="∫" label="f(x)dx" glow="#f43f5e" />
      </div>

      {/* Sigma Badge (Top Right Near Header) */}
      <div className="pointer-events-auto hidden md:block absolute top-24 right-[22%] animate-[float-reverse_8.5s_ease-in-out_infinite] opacity-55 sm:opacity-75 hover:opacity-100 transition-all duration-300">
        <MathGlassBadge symbol="∑" label="i=1..n" glow="#fb7185" />
      </div>

      {/* Pi Badge (Lower Left Flank) */}
      <div className="pointer-events-auto absolute bottom-28 left-4 sm:left-14 lg:left-28 animate-[float-slow_9.5s_ease-in-out_infinite] opacity-55 sm:opacity-75 hover:opacity-100 transition-all duration-300">
        <MathGlassBadge symbol="π" label="3.14159..." glow="#e11d48" />
      </div>

      {/* Infinity Badge (Lower Right Flank) */}
      <div className="pointer-events-auto absolute bottom-28 right-4 sm:right-14 lg:right-28 animate-[float-reverse_9s_ease-in-out_infinite] opacity-55 sm:opacity-75 hover:opacity-100 transition-all duration-300">
        <MathGlassBadge symbol="∞" label="limit" glow="#f43f5e" />
      </div>

      {/* Golden Ratio Phi Badge (Center Ambient Left) */}
      <div className="pointer-events-auto hidden lg:block absolute top-[65%] left-[8%] animate-[float-slow_8s_ease-in-out_infinite] opacity-50 sm:opacity-70 hover:opacity-100 transition-all duration-300">
        <MathGlassBadge symbol="Φ" label="1.618" glow="#fb7185" />
      </div>

      {/* Nabla / Delta Vector Operator Badge (Center Ambient Right) */}
      <div className="pointer-events-auto hidden lg:block absolute top-[62%] right-[8%] animate-[float-reverse_10s_ease-in-out_infinite] opacity-50 sm:opacity-70 hover:opacity-100 transition-all duration-300">
        <MathGlassBadge symbol="∇" label="vector" glow="#f43f5e" />
      </div>
    </div>
  );
}

/**
 * Floating 3D Frosted Glass Math Badge with Specular Reflection
 */
function MathGlassBadge({
  symbol,
  label,
  glow = "#f43f5e",
}: {
  symbol: string;
  label: string;
  glow?: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 backdrop-blur-xl border border-white/20 transition-all duration-300 hover:scale-105 hover:border-white/40 cursor-default"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(20,4,8,0.50) 100%)",
        boxShadow: `0 10px 25px -6px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.25), 0 0 16px -4px ${glow}30`,
      }}
    >
      <span
        className="font-serif text-lg sm:text-xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-none"
        style={{ textShadow: `0 0 12px ${glow}` }}
      >
        {symbol}
      </span>
      <span className="font-mono text-[10px] font-bold text-rose-200/90 tracking-tight">
        {label}
      </span>
    </div>
  );
}
