import React from "react";

/**
 * LandingBodyBackdrop
 * Latar belakang tematik matematika profesional untuk area bawah landing page.
 * Menampilkan diagram geometri analitis, kurva Gaussian, gelombang sinusoidal,
 * spiral rasio emas Fibonacci, rumus matematika klasik, dan pendaran ambien rose-gold.
 */
export function LandingBodyBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Ambient Lighting Orbs to Enhance Frosted Glassmorphism Refraction */}
      <div className="absolute top-24 left-[5%] size-[500px] rounded-full bg-rose-500/6 blur-[120px] transform-gpu" />
      <div className="absolute top-[35%] right-[3%] size-[600px] rounded-full bg-red-600/5 blur-[140px] transform-gpu" />
      <div className="absolute top-[65%] left-[10%] size-[550px] rounded-full bg-amber-500/5 blur-[130px] transform-gpu" />
      <div className="absolute bottom-12 right-[8%] size-[450px] rounded-full bg-rose-500/6 blur-[110px] transform-gpu" />

      {/* 2. Top-Left Flank: Trigonometric Unit Circle with Radian Rays & Coordinate Grid */}
      <div className="absolute top-12 -left-20 lg:left-2 w-[420px] h-[420px] opacity-[0.14] text-rose-900 transition-opacity">
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="unitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#be123c" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
          {/* Main Unit Circle */}
          <circle cx="200" cy="200" r="140" stroke="url(#unitGrad)" strokeWidth="1.5" />
          <circle cx="200" cy="200" r="140" stroke="url(#unitGrad)" strokeWidth="0.8" strokeDasharray="4 4" />
          <circle cx="200" cy="200" r="70" stroke="url(#unitGrad)" strokeWidth="0.8" strokeDasharray="3 3" />

          {/* Coordinate Axes */}
          <line x1="20" y1="200" x2="380" y2="200" stroke="url(#unitGrad)" strokeWidth="1.5" />
          <line x1="200" y1="20" x2="200" y2="380" stroke="url(#unitGrad)" strokeWidth="1.5" />

          {/* Axis Arrows */}
          <path d="M375,195 L385,200 L375,205" fill="none" stroke="url(#unitGrad)" strokeWidth="1.5" />
          <path d="M195,25 L200,15 L205,25" fill="none" stroke="url(#unitGrad)" strokeWidth="1.5" />

          {/* Radian Rays (30°, 45°, 60°, 120°, 135°, 150°) */}
          <line x1="78" y1="270" x2="322" y2="130" stroke="url(#unitGrad)" strokeWidth="0.8" strokeDasharray="3 4" />
          <line x1="101" y1="299" x2="299" y2="101" stroke="url(#unitGrad)" strokeWidth="0.8" strokeDasharray="3 4" />
          <line x1="130" y1="322" x2="270" y2="78" stroke="url(#unitGrad)" strokeWidth="0.8" strokeDasharray="3 4" />
          <line x1="78" y1="130" x2="322" y2="270" stroke="url(#unitGrad)" strokeWidth="0.8" strokeDasharray="3 4" />
          <line x1="101" y1="101" x2="299" y2="299" stroke="url(#unitGrad)" strokeWidth="0.8" strokeDasharray="3 4" />

          {/* Sine and Cosine Triangle Projection */}
          <polygon points="200,200 299,200 299,101" fill="rgba(244,63,94,0.08)" stroke="url(#unitGrad)" strokeWidth="1.2" />
          <text x="245" y="216" className="font-mono text-[11px] font-bold fill-rose-900">cos θ</text>
          <text x="306" y="155" className="font-mono text-[11px] font-bold fill-rose-900">sin θ</text>
          <text x="345" y="190" className="font-mono text-[11px] font-bold fill-rose-900">(1, 0)</text>
          <text x="206" y="38" className="font-mono text-[11px] font-bold fill-rose-900">(0, 1)</text>
          <text x="304" y="94" className="font-mono text-[10px] font-bold fill-rose-900">π/4</text>
        </svg>
      </div>

      {/* 3. Mid-Right Flank: Gaussian Normal Distribution & Statistical Density Graph */}
      <div className="absolute top-[32%] -right-16 lg:right-4 w-[480px] h-[280px] opacity-[0.15] text-rose-900">
        <svg viewBox="0 0 480 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="gaussGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gaussLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#be123c" />
              <stop offset="50%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="40" y1="210" x2="440" y2="210" stroke="#be123c" strokeWidth="1.5" />
          <line x1="240" y1="30" x2="240" y2="210" stroke="#be123c" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="170" y1="90" x2="170" y2="210" stroke="#be123c" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="310" y1="90" x2="310" y2="210" stroke="#be123c" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="100" y1="170" x2="100" y2="210" stroke="#be123c" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="380" y1="170" x2="380" y2="210" stroke="#be123c" strokeWidth="0.8" strokeDasharray="3 3" />

          {/* Gaussian Filled Area */}
          <path
            d="M 40,210 Q 140,210 170,140 T 240,45 T 310,140 Q 340,210 440,210 Z"
            fill="url(#gaussGrad)"
          />

          {/* Gaussian Bell Curve Line */}
          <path
            d="M 40,210 Q 140,210 170,140 T 240,45 T 310,140 Q 340,210 440,210"
            fill="none"
            stroke="url(#gaussLine)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Statistical Annotations */}
          <text x="235" y="228" className="font-mono text-[11px] font-bold fill-rose-900">μ</text>
          <text x="300" y="228" className="font-mono text-[11px] font-bold fill-rose-900">+1σ</text>
          <text x="370" y="228" className="font-mono text-[11px] font-bold fill-rose-900">+2σ</text>
          <text x="160" y="228" className="font-mono text-[11px] font-bold fill-rose-900">-1σ</text>
          <text x="90" y="228" className="font-mono text-[11px] font-bold fill-rose-900">-2σ</text>
          <text x="210" y="32" className="font-serif italic text-[12px] font-bold fill-rose-900">f(x) ~ N(μ, σ²)</text>
          <text x="226" y="115" className="font-mono text-[10px] font-bold fill-rose-800">68.2%</text>
        </svg>
      </div>

      {/* 4. Lower-Left Flank: Golden Ratio Fibonacci Spiral & Geometry Subdivisions */}
      <div className="absolute top-[60%] -left-12 lg:left-6 w-[400px] h-[320px] opacity-[0.13] text-rose-900">
        <svg viewBox="0 0 380 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="phiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#be123c" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>

          {/* Golden Rectangles */}
          <rect x="20" y="20" width="340" height="210" stroke="url(#phiGrad)" strokeWidth="1.2" />
          <line x1="230" y1="20" x2="230" y2="230" stroke="url(#phiGrad)" strokeWidth="1" />
          <line x1="230" y1="150" x2="360" y2="150" stroke="url(#phiGrad)" strokeWidth="1" />
          <line x1="280" y1="150" x2="280" y2="230" stroke="url(#phiGrad)" strokeWidth="0.8" />
          <line x1="230" y1="200" x2="280" y2="200" stroke="url(#phiGrad)" strokeWidth="0.8" />

          {/* Logarithmic Golden Spiral */}
          <path
            d="M 20,230 A 210,210 0 0,1 230,20 A 130,130 0 0,1 360,150 A 80,80 0 0,1 280,230 A 50,50 0 0,1 230,180 A 30,30 0 0,1 260,150"
            fill="none"
            stroke="url(#phiGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          <text x="32" y="44" className="font-serif italic text-[14px] font-bold fill-rose-900">Φ = 1.6180339887...</text>
          <text x="110" y="130" className="font-mono text-[11px] font-bold fill-rose-800">a/b = (a+b)/a = Φ</text>
        </svg>
      </div>

      {/* 5. Center-Flowing Sine & Cosine Wave Oscillation */}
      <div className="absolute top-[48%] left-1/2 -translate-x-1/2 w-full max-w-5xl h-[120px] opacity-[0.10] pointer-events-none">
        <svg viewBox="0 0 1000 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          {/* Central Axis */}
          <line x1="0" y1="60" x2="1000" y2="60" stroke="#be123c" strokeWidth="1" strokeDasharray="6 6" />
          {/* Sine Wave */}
          <path
            d="M 0,60 Q 125,0 250,60 T 500,60 T 750,60 T 1000,60"
            fill="none"
            stroke="#be123c"
            strokeWidth="2"
          />
          {/* Cosine Wave */}
          <path
            d="M 0,0 Q 125,120 250,60 T 500,60 T 750,60 T 1000,0"
            fill="none"
            stroke="#fb7185"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>
      </div>

      {/* 6. Subtle Iconic Math Equation Watermarks (Dispersed with Tasteful Academic Rigor) */}
      {/* Euler's Identity */}
      <div className="hidden md:block absolute top-[18%] right-[14%] opacity-[0.12] text-rose-950 font-serif italic text-xl sm:text-2xl font-bold tracking-wider">
        e<sup className="text-xs">iπ</sup> + 1 = 0
      </div>

      {/* Gaussian Integral */}
      <div className="hidden lg:block absolute top-[28%] left-[16%] opacity-[0.12] text-rose-950 font-serif text-lg sm:text-xl font-bold">
        ∫<sub className="text-xs">-∞</sub><sup className="text-xs">∞</sup> e<sup className="text-xs">-x²</sup> dx = √π
      </div>

      {/* Basel Problem / Riemann Zeta */}
      <div className="hidden md:block absolute top-[52%] right-[18%] opacity-[0.12] text-rose-950 font-serif text-lg sm:text-xl font-bold">
        ∑<sub className="text-xs">n=1</sub><sup className="text-xs">∞</sup> 1/n² = π²/6
      </div>

      {/* Fundamental Theorem of Calculus */}
      <div className="hidden lg:block absolute top-[74%] right-[12%] opacity-[0.12] text-rose-950 font-serif text-lg sm:text-xl font-bold">
        ∫<sub className="text-xs">a</sub><sup className="text-xs">b</sup> f(x)dx = F(b) - F(a)
      </div>

      {/* Limit of sin(x)/x */}
      <div className="hidden md:block absolute top-[80%] left-[18%] opacity-[0.12] text-rose-950 font-serif text-base sm:text-lg font-bold">
        lim<sub className="text-[10px]">x→0</sub> (sin x / x) = 1
      </div>
    </div>
  );
}
