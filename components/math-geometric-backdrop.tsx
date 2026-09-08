"use client";

import React from "react";

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

      {/* 2. Top-Left: 3D Icosahedron (Platonic Solid - 20 Facets) */}
      <div className="absolute top-8 left-3 sm:left-8 lg:left-14 animate-[float-slow_9s_ease-in-out_infinite] opacity-40 sm:opacity-55 hover:opacity-85 transition-opacity duration-300">
        <Icosahedron3D />
      </div>

      {/* 3. Top-Right: 3D Dodecahedron (Pentagonal Geometry) */}
      <div className="absolute top-10 right-3 sm:right-8 lg:right-16 animate-[float-reverse_11s_ease-in-out_infinite] opacity-40 sm:opacity-55 hover:opacity-85 transition-opacity duration-300">
        <Dodecahedron3D />
      </div>

      {/* 4. Mid-Left: 3D Octahedron (Diamond Crystal Dual-Pyramid) */}
      <div className="hidden sm:block absolute top-52 left-6 lg:left-20 animate-[float-reverse_8s_ease-in-out_infinite] opacity-35 sm:opacity-50 hover:opacity-80 transition-opacity duration-300">
        <Octahedron3D />
      </div>

      {/* 5. Mid-Right: 3D Torus Ribbon Knot (Topology) */}
      <div className="hidden sm:block absolute top-48 right-6 lg:right-20 animate-[float-slow_10s_ease-in-out_infinite] opacity-35 sm:opacity-50 hover:opacity-80 transition-opacity duration-300">
        <TorusKnot3D />
      </div>

      {/* 6. Floating 3D Glass Math Badges (Elegantly Scattered with Translucent Depth) */}
      {/* Integral Badge (Top Left Near Header) */}
      <div className="hidden md:block absolute top-28 left-[22%] animate-[float-slow_7s_ease-in-out_infinite] opacity-45 sm:opacity-60 hover:opacity-95 transition-opacity duration-300">
        <MathGlassBadge symbol="∫" label="f(x)dx" glow="#f43f5e" />
      </div>

      {/* Sigma Badge (Top Right Near Header) */}
      <div className="hidden md:block absolute top-24 right-[22%] animate-[float-reverse_8.5s_ease-in-out_infinite] opacity-45 sm:opacity-60 hover:opacity-95 transition-opacity duration-300">
        <MathGlassBadge symbol="∑" label="i=1..n" glow="#fb7185" />
      </div>

      {/* Pi Badge (Lower Left Flank) */}
      <div className="absolute bottom-28 left-4 sm:left-14 lg:left-28 animate-[float-slow_9.5s_ease-in-out_infinite] opacity-45 sm:opacity-60 hover:opacity-95 transition-opacity duration-300">
        <MathGlassBadge symbol="π" label="3.14159..." glow="#e11d48" />
      </div>

      {/* Infinity Badge (Lower Right Flank) */}
      <div className="absolute bottom-28 right-4 sm:right-14 lg:right-28 animate-[float-reverse_9s_ease-in-out_infinite] opacity-45 sm:opacity-60 hover:opacity-95 transition-opacity duration-300">
        <MathGlassBadge symbol="∞" label="limit" glow="#f43f5e" />
      </div>

      {/* Golden Ratio Phi Badge (Center Ambient Left) */}
      <div className="hidden lg:block absolute top-[65%] left-[8%] animate-[float-slow_8s_ease-in-out_infinite] opacity-40 sm:opacity-55 hover:opacity-90 transition-opacity duration-300">
        <MathGlassBadge symbol="Φ" label="1.618" glow="#fb7185" />
      </div>

      {/* Nabla / Delta Vector Operator Badge (Center Ambient Right) */}
      <div className="hidden lg:block absolute top-[62%] right-[8%] animate-[float-reverse_10s_ease-in-out_infinite] opacity-40 sm:opacity-55 hover:opacity-90 transition-opacity duration-300">
        <MathGlassBadge symbol="∇" label="vector" glow="#f43f5e" />
      </div>
    </div>
  );
}

/**
 * 3D Icosahedron with Translucent Facet Shading and Specular Line Edges
 */
function Icosahedron3D() {
  return (
    <div className="relative group transition-transform duration-500 hover:scale-105">
      <svg
        width="130"
        height="130"
        viewBox="0 0 130 130"
        className="drop-shadow-[0_10px_25px_rgba(244,63,94,0.25)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="icoF1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fda4af" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.14" />
          </linearGradient>
          <linearGradient id="icoF2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#be123c" stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="icoF3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#be123c" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#881337" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="icoF4" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#9f1239" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Center Triangular Face (Facing Viewer) */}
        <polygon points="65,32 94,80 36,80" fill="url(#icoF1)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />

        {/* Upper Facets */}
        <polygon points="65,12 65,32 36,80" fill="url(#icoF2)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
        <polygon points="65,12 94,80 65,32" fill="url(#icoF1)" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" />
        <polygon points="65,12 108,35 94,80" fill="url(#icoF4)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.75" />
        <polygon points="65,12 22,35 36,80" fill="url(#icoF3)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.75" />

        {/* Lateral Flanking Facets */}
        <polygon points="22,35 36,80 16,92" fill="url(#icoF3)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.75" />
        <polygon points="108,35 94,80 114,92" fill="url(#icoF2)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.75" />

        {/* Bottom Facets */}
        <polygon points="36,80 65,118 94,80" fill="url(#icoF3)" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" />
        <polygon points="36,80 16,92 65,118" fill="url(#icoF2)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.75" />
        <polygon points="94,80 114,92 65,118" fill="url(#icoF4)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.75" />

        {/* Glowing 3D Vertices */}
        <circle cx="65" cy="12" r="2" fill="#ffffff" className="drop-shadow-[0_0_3px_#ffffff]" />
        <circle cx="65" cy="32" r="2" fill="#ffffff" className="drop-shadow-[0_0_3px_#ffffff]" />
        <circle cx="36" cy="80" r="2" fill="#ffffff" className="drop-shadow-[0_0_3px_#ffffff]" />
        <circle cx="94" cy="80" r="2" fill="#ffffff" className="drop-shadow-[0_0_3px_#ffffff]" />
        <circle cx="65" cy="118" r="2" fill="#ffffff" className="drop-shadow-[0_0_3px_#ffffff]" />
      </svg>
    </div>
  );
}

/**
 * 3D Octahedron (Dual-Pyramid Diamond Geometry)
 */
function Octahedron3D() {
  return (
    <div className="relative group transition-transform duration-500 hover:scale-105">
      <svg
        width="110"
        height="125"
        viewBox="0 0 110 125"
        className="drop-shadow-[0_10px_25px_rgba(225,29,72,0.25)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="octTopLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fda4af" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.14" />
          </linearGradient>
          <linearGradient id="octTopRight" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#be123c" stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="octBotLeft" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#be123c" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#881337" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="octBotRight" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#9f1239" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#4c0519" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Upper Pyramid Faces */}
        <polygon points="55,10 15,62 55,75" fill="url(#octTopLeft)" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" />
        <polygon points="55,10 95,62 55,75" fill="url(#octTopRight)" stroke="rgba(255,255,255,0.24)" strokeWidth="0.8" />

        {/* Lower Inverted Pyramid Faces */}
        <polygon points="55,115 15,62 55,75" fill="url(#octBotLeft)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
        <polygon points="55,115 95,62 55,75" fill="url(#octBotRight)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />

        {/* Interior Wireframe Axis */}
        <line x1="55" y1="10" x2="55" y2="115" stroke="rgba(255,255,255,0.16)" strokeWidth="0.6" strokeDasharray="2 3" />
        <line x1="15" y1="62" x2="95" y2="62" stroke="rgba(255,255,255,0.14)" strokeWidth="0.6" strokeDasharray="2 3" />

        {/* Glowing Vertices */}
        <circle cx="55" cy="10" r="2" fill="#ffffff" className="drop-shadow-[0_0_3px_#ffffff]" />
        <circle cx="15" cy="62" r="1.8" fill="#ffffff" className="drop-shadow-[0_0_3px_#ffffff]" />
        <circle cx="95" cy="62" r="1.8" fill="#ffffff" className="drop-shadow-[0_0_3px_#ffffff]" />
        <circle cx="55" cy="75" r="2" fill="#ffffff" className="drop-shadow-[0_0_3px_#ffffff]" />
        <circle cx="55" cy="115" r="2" fill="#ffffff" className="drop-shadow-[0_0_3px_#ffffff]" />
      </svg>
    </div>
  );
}

/**
 * 3D Dodecahedron with Pentagonal Planes
 */
function Dodecahedron3D() {
  return (
    <div className="relative group transition-transform duration-500 hover:scale-105">
      <svg
        width="130"
        height="130"
        viewBox="0 0 130 130"
        className="drop-shadow-[0_10px_25px_rgba(251,113,133,0.25)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="dodecCenter" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fecdd3" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.14" />
          </linearGradient>
          <linearGradient id="dodecTop" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#be123c" stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="dodecSide" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#be123c" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#881337" stopOpacity="0.18" />
          </linearGradient>
        </defs>

        {/* Central Regular Pentagon */}
        <polygon
          points="65,38 88,55 79,83 51,83 42,55"
          fill="url(#dodecCenter)"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.8"
        />

        {/* Top Pentagon */}
        <polygon
          points="65,38 88,55 106,42 94,18 65,16"
          fill="url(#dodecTop)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.8"
        />

        {/* Top-Left Pentagon */}
        <polygon
          points="65,38 42,55 24,42 36,18 65,16"
          fill="url(#dodecTop)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.8"
        />

        {/* Bottom-Left Pentagon */}
        <polygon
          points="42,55 51,83 38,108 14,96 24,42"
          fill="url(#dodecSide)"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.75"
        />

        {/* Bottom-Right Pentagon */}
        <polygon
          points="88,55 79,83 92,108 116,96 106,42"
          fill="url(#dodecSide)"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.75"
        />

        {/* Bottom Base Pentagon */}
        <polygon
          points="51,83 79,83 92,108 65,118 38,108"
          fill="url(#dodecSide)"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.75"
        />

        {/* Glowing Vertices */}
        <circle cx="65" cy="16" r="2" fill="#ffffff" />
        <circle cx="65" cy="38" r="2" fill="#ffffff" />
        <circle cx="88" cy="55" r="2" fill="#ffffff" />
        <circle cx="42" cy="55" r="2" fill="#ffffff" />
        <circle cx="79" cy="83" r="2" fill="#ffffff" />
        <circle cx="51" cy="83" r="2" fill="#ffffff" />
        <circle cx="65" cy="118" r="2" fill="#ffffff" />
      </svg>
    </div>
  );
}

/**
 * 3D Torus Ribbon Knot (Differential Geometry & Topology)
 */
function TorusKnot3D() {
  return (
    <div className="relative group transition-transform duration-500 hover:scale-105">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        className="drop-shadow-[0_10px_25px_rgba(244,63,94,0.25)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="torusGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
          <linearGradient id="torusGrad2" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="70%" stopColor="#881337" />
            <stop offset="100%" stopColor="#4c0519" />
          </linearGradient>
        </defs>

        {/* Overlapping Parametric Curves */}
        <path
          d="M60,18 C88,18 106,36 106,60 C106,84 88,102 60,102 C32,102 14,84 14,60 C14,36 32,18 60,18 Z"
          stroke="url(#torusGrad1)"
          strokeWidth="4"
          strokeLinecap="round"
          className="opacity-45"
        />
        <path
          d="M30,34 C42,16 78,16 90,34 C104,54 84,86 60,86 C36,86 16,54 30,34 Z"
          stroke="url(#torusGrad2)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="180"
          className="opacity-55"
        />
        <circle cx="60" cy="60" r="16" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" strokeDasharray="3 3" />
        <circle cx="60" cy="60" r="2" fill="#ffffff" className="drop-shadow-[0_0_3px_#ffffff]" />
      </svg>
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
