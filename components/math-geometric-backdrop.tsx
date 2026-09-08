"use client";

import React, { useEffect, useRef } from "react";

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

      {/* 2. Top-Left: True 3D Rotating Icosahedron (Platonic Solid - 20 Triangles) */}
      <div className="pointer-events-auto absolute top-8 left-3 sm:left-8 lg:left-14 opacity-65 sm:opacity-85 hover:opacity-100 transition-all duration-300">
        <RotatingPolyhedron3D
          type="icosahedron"
          size={145}
          speed={{ x: 0.007, y: 0.010, z: 0.004 }}
          glowColor="#f43f5e"
          label="Ikosahedron 3D"
        />
      </div>

      {/* 3. Top-Right: True 3D Rotating Dodecahedron (Platonic Solid - 12 Pentagons) */}
      <div className="pointer-events-auto absolute top-10 right-3 sm:right-8 lg:right-16 opacity-65 sm:opacity-85 hover:opacity-100 transition-all duration-300">
        <RotatingPolyhedron3D
          type="dodecahedron"
          size={145}
          speed={{ x: 0.008, y: -0.009, z: 0.005 }}
          glowColor="#fb7185"
          label="Dodekahedron 3D"
        />
      </div>

      {/* 4. Mid-Left: True 3D Rotating Octahedron (Dual-Pyramid Diamond) */}
      <div className="pointer-events-auto hidden sm:block absolute top-52 left-6 lg:left-20 opacity-60 sm:opacity-80 hover:opacity-100 transition-all duration-300">
        <RotatingPolyhedron3D
          type="octahedron"
          size={135}
          speed={{ x: -0.009, y: 0.011, z: -0.005 }}
          glowColor="#e11d48"
          label="Oktahedron 3D"
        />
      </div>

      {/* 5. Mid-Right: True 3D Rotating Torus Knot (Parametric Topology) */}
      <div className="pointer-events-auto hidden sm:block absolute top-48 right-6 lg:right-20 opacity-60 sm:opacity-80 hover:opacity-100 transition-all duration-300">
        <RotatingPolyhedron3D
          type="torusKnot"
          size={140}
          speed={{ x: 0.010, y: 0.012, z: 0.006 }}
          glowColor="#f43f5e"
          label="Torus Knot 3D"
        />
      </div>

      {/* 6. Floating 3D Glass Math Badges (Elegantly Scattered with Translucent Depth) */}
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
 * Mathematically Authentic 3D Rotating Polyhedron Canvas
 * Projects 3D mathematical models in real-time with dynamic lighting,
 * translucent facet blending, glowing edges, and luminous vertex points.
 */
export function RotatingPolyhedron3D({
  type,
  size = 140,
  speed = { x: 0.008, y: 0.010, z: 0.005 },
  glowColor = "#f43f5e",
  label,
}: {
  type: "icosahedron" | "dodecahedron" | "octahedron" | "torusKnot";
  size?: number;
  speed?: { x: number; y: number; z: number };
  glowColor?: string;
  label?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    // Generate geometry based on type
    const geometry = getGeometry(type);

    let angleX = Math.random() * Math.PI * 2;
    let angleY = Math.random() * Math.PI * 2;
    let angleZ = Math.random() * Math.PI * 2;

    // Interactive mouse drag state
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let dragVelocityX = 0;
    let dragVelocityY = 0;
    let isHovered = false;

    // Global cursor tracking for ambient tilt
    let globalMouseX = window.innerWidth / 2;
    let globalMouseY = window.innerHeight / 2;
    let hasMouseMoved = false;
    let tiltX = 0;
    let tiltY = 0;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      globalMouseX = e.clientX;
      globalMouseY = e.clientY;
      hasMouseMoved = true;
    };
    window.addEventListener("pointermove", handleGlobalPointerMove, { passive: true });

    // Direct pointer event handlers on canvas
    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      dragVelocityX = 0;
      dragVelocityY = 0;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;

      const sensitivity = 0.012;
      angleY += dx * sensitivity;
      angleX -= dy * sensitivity;

      dragVelocityX = dx * sensitivity;
      dragVelocityY = -dy * sensitivity;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    };

    const handleMouseEnter = () => {
      isHovered = true;
    };

    const handleMouseLeave = () => {
      isHovered = false;
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    let animId: number;
    let isVisible = true;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Physics & Rotation update
      if (isDragging) {
        // Handled in real time by pointermove
      } else if (Math.abs(dragVelocityX) > 0.0002 || Math.abs(dragVelocityY) > 0.0002) {
        // Inertia fling momentum
        angleY += dragVelocityX;
        angleX += dragVelocityY;
        dragVelocityX *= 0.94;
        dragVelocityY *= 0.94;
        angleZ += speed.z;
      } else {
        // Ambient natural rotation
        angleX += speed.x + (isHovered ? speed.x * 0.4 : 0);
        angleY += speed.y + (isHovered ? speed.y * 0.4 : 0);
        angleZ += speed.z;
      }

      // Cursor-tracking tilt & parallax
      if (hasMouseMoved && !isDragging) {
        const rect = canvas.getBoundingClientRect();
        const objCenterX = rect.left + rect.width / 2;
        const objCenterY = rect.top + rect.height / 2;
        const dx = (globalMouseX - objCenterX) / (window.innerWidth * 0.5);
        const dy = (globalMouseY - objCenterY) / (window.innerHeight * 0.5);
        const targetTiltX = Math.max(-0.55, Math.min(0.55, dy * 0.55));
        const targetTiltY = Math.max(-0.55, Math.min(0.55, dx * 0.55));
        tiltX += (targetTiltX - tiltX) * 0.06;
        tiltY += (targetTiltY - tiltY) * 0.06;
      } else if (!isDragging) {
        tiltX += (0 - tiltX) * 0.04;
        tiltY += (0 - tiltY) * 0.04;
      }

      const effectiveAngleX = angleX + tiltX;
      const effectiveAngleY = angleY + tiltY;
      const effectiveAngleZ = angleZ;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, size, size);

      // Subtle parallax shift of projection center based on mouse
      const parallaxShiftX = tiltY * 10;
      const parallaxShiftY = tiltX * 10;
      const cx = size / 2 + parallaxShiftX;
      const cy = size / 2 + parallaxShiftY;
      const cameraDistance = 3.4;
      const fov = 3.0;
      const radius = size * 0.44;

      const cosX = Math.cos(effectiveAngleX);
      const sinX = Math.sin(effectiveAngleX);
      const cosY = Math.cos(effectiveAngleY);
      const sinY = Math.sin(effectiveAngleY);
      const cosZ = Math.cos(effectiveAngleZ);
      const sinZ = Math.sin(effectiveAngleZ);

      // Rotate and project all vertices
      const projected = geometry.vertices.map(([vx, vy, vz]) => {
        // Rotate X
        const y1 = vy * cosX - vz * sinX;
        const z1 = vy * sinX + vz * cosX;
        // Rotate Y
        const x2 = vx * cosY + z1 * sinY;
        const z2 = -vx * sinY + z1 * cosY;
        // Rotate Z
        const x3 = x2 * cosZ - y1 * sinZ;
        const y3 = x2 * sinZ + y1 * cosZ;
        const z3 = z2;

        const depth = z3 + cameraDistance;
        const projScale = (fov / depth);
        const px = cx + x3 * radius * projScale;
        const py = cy + y3 * radius * projScale;

        return { x: px, y: py, z: z3, rx: x3, ry: y3, rz: z3, scale: projScale };
      });

      // Render Torus Knot Curve
      if (geometry.isCurve && geometry.segments) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Draw ambient glow trail
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = isHovered || isDragging ? 18 : 12;

        for (let i = 0; i < geometry.segments.length; i++) {
          const [i0, i1] = geometry.segments[i];
          const p0 = projected[i0];
          const p1 = projected[i1];
          const avgZ = (p0.z + p1.z) / 2;
          const alpha = Math.max(0.18, Math.min(0.95, 0.52 + avgZ * 0.45));

          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.strokeStyle = `rgba(251, 113, 133, ${alpha})`;
          ctx.lineWidth = Math.max(1, 2.6 * p0.scale);
          ctx.stroke();
        }

        // Draw knots vertices
        for (let i = 0; i < projected.length; i += 3) {
          const p = projected[i];
          const nodeAlpha = Math.max(0.2, Math.min(1, 0.6 + p.z * 0.4));
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1.2, 2.2 * p.scale), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${nodeAlpha})`;
          ctx.fill();
        }

        ctx.restore();
        animId = requestAnimationFrame(render);
        return;
      }

      // Render Polyhedron Faces (Sorted by average depth for painter's algorithm)
      // Dynamic light source tilts slightly with cursor
      const lightDir = normalize([
        0.35 + tiltY * 0.4,
        -0.65 + tiltX * 0.4,
        0.70
      ]);

      type FaceInfo = {
        face: number[];
        avgZ: number;
        nz: number;
        lightDot: number;
      };

      const faceInfos: FaceInfo[] = geometry.faces.map((face) => {
        let sumZ = 0;
        for (const idx of face) sumZ += projected[idx].z;
        const avgZ = sumZ / face.length;

        // Compute 3D face normal
        const p0 = projected[face[0]];
        const p1 = projected[face[1]];
        const p2 = projected[face[2]];

        const v1 = [p1.rx - p0.rx, p1.ry - p0.ry, p1.rz - p0.rz];
        const v2 = [p2.rx - p0.rx, p2.ry - p0.ry, p2.rz - p0.rz];

        const nx = v1[1] * v2[2] - v1[2] * v2[1];
        const ny = v1[2] * v2[0] - v1[0] * v2[2];
        const nz = v1[0] * v2[1] - v1[1] * v2[0];
        const nNorm = normalize([nx, ny, nz]);

        const lightDot = Math.max(0, nNorm[0] * lightDir[0] + nNorm[1] * lightDir[1] + nNorm[2] * lightDir[2]);

        return { face, avgZ, nz: nNorm[2], lightDot };
      });

      // Sort back-to-front
      faceInfos.sort((a, b) => a.avgZ - b.avgZ);

      // Draw each face with translucent lighting
      for (const { face, nz, lightDot } of faceInfos) {
        ctx.beginPath();
        const first = projected[face[0]];
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < face.length; i++) {
          const pt = projected[face[i]];
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();

        const isFront = nz > 0;
        if (isFront) {
          // Luminous specular reflection
          const baseAlpha = (isHovered || isDragging ? 0.22 : 0.16) + 0.32 * lightDot;
          ctx.fillStyle = `rgba(244, 63, 94, ${baseAlpha})`;
          ctx.fill();
        } else {
          // Subtle deep wine translucency for back facets
          ctx.fillStyle = "rgba(136, 19, 55, 0.08)";
          ctx.fill();
        }

        // Face edge stroke
        ctx.strokeStyle = isFront
          ? `rgba(254, 205, 211, ${0.38 + 0.38 * lightDot})`
          : "rgba(225, 29, 72, 0.14)";
        ctx.lineWidth = isFront ? (isHovered || isDragging ? 1.3 : 1.1) : 0.8;
        ctx.stroke();
      }

      // Draw glowing vertex nodes
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = isHovered || isDragging ? 8 : 6;
      for (const pt of projected) {
        const nodeAlpha = Math.max(0.3, Math.min(1, 0.6 + pt.z * 0.45));
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(1.2, 2.2 * pt.scale), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${nodeAlpha})`;
        ctx.fill();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [type, size, speed, glowColor]);

  return (
    <div
      className="group relative flex flex-col items-center justify-center transition-all duration-300 hover:scale-110"
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        className="block cursor-grab active:cursor-grabbing touch-none select-none drop-shadow-[0_0_20px_rgba(244,63,94,0.30)] group-hover:drop-shadow-[0_0_30px_rgba(244,63,94,0.55)] transition-all"
        style={{ width: size, height: size, touchAction: "none" }}
        title="Klik &amp; geser untuk memutar objek 3D"
      />
      {label && (
        <span className="pointer-events-none absolute -bottom-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 apple-glass-pill px-2.5 py-0.5 text-[10px] font-bold text-rose-100 whitespace-nowrap shadow-md scale-90 group-hover:scale-100 border border-rose-400/30 bg-black/50 backdrop-blur-md">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Geometric Model Definitions
 */
function getGeometry(type: "icosahedron" | "dodecahedron" | "octahedron" | "torusKnot") {
  if (type === "icosahedron") {
    const phi = (1 + Math.sqrt(5)) / 2;
    const L = Math.sqrt(1 + phi * phi);
    const a = 1 / L;
    const b = phi / L;
    const vertices: [number, number, number][] = [
      [-a,  b,  0], [ a,  b,  0], [-a, -b,  0], [ a, -b,  0],
      [ 0, -a,  b], [ 0,  a,  b], [ 0, -a, -b], [ 0,  a, -b],
      [ b,  0, -a], [ b,  0,  a], [-b,  0, -a], [-b,  0,  a],
    ];
    const faces = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
    ];
    return { vertices, faces, isCurve: false };
  }

  if (type === "octahedron") {
    const vertices: [number, number, number][] = [
      [ 1,  0,  0], [-1,  0,  0],
      [ 0,  1,  0], [ 0, -1,  0],
      [ 0,  0,  1], [ 0,  0, -1],
    ];
    const faces = [
      [0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4],
      [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5],
    ];
    return { vertices, faces, isCurve: false };
  }

  if (type === "dodecahedron") {
    const phi = (1 + Math.sqrt(5)) / 2;
    const invPhi = 1 / phi;
    const norm = Math.sqrt(3);
    const rawVerts: [number, number, number][] = [
      [-1, -1, -1], [-1, -1,  1], [-1,  1, -1], [-1,  1,  1],
      [ 1, -1, -1], [ 1, -1,  1], [ 1,  1, -1], [ 1,  1,  1],
      [ 0, -invPhi, -phi], [ 0, -invPhi,  phi], [ 0,  invPhi, -phi], [ 0,  invPhi,  phi],
      [-invPhi, -phi, 0], [-invPhi,  phi, 0], [ invPhi, -phi, 0], [ invPhi,  phi, 0],
      [-phi, 0, -invPhi], [-phi, 0,  invPhi], [ phi, 0, -invPhi], [ phi, 0,  invPhi],
    ];
    const vertices: [number, number, number][] = rawVerts.map(
      ([x, y, z]) => [x / norm, y / norm, z / norm]
    );

    // 12 pentagonal faces ordered cyclically around the face centers
    const a = 1 / Math.sqrt(1 + phi * phi);
    const b = phi / Math.sqrt(1 + phi * phi);
    const centers: [number, number, number][] = [
      [-a,  b,  0], [ a,  b,  0], [-a, -b,  0], [ a, -b,  0],
      [ 0, -a,  b], [ 0,  a,  b], [ 0, -a, -b], [ 0,  a, -b],
      [ b,  0, -a], [ b,  0,  a], [-b,  0, -a], [-b,  0,  a],
    ];

    const faces: number[][] = centers.map((center) => {
      const withDist = vertices.map((v, idx) => {
        const dx = v[0] - center[0];
        const dy = v[1] - center[1];
        const dz = v[2] - center[2];
        return { idx, dist: dx * dx + dy * dy + dz * dz, v };
      });
      withDist.sort((p1, p2) => p1.dist - p2.dist);
      const top5 = withDist.slice(0, 5);

      const [cx, cy, cz] = center;
      const up = Math.abs(cz) < 0.9 ? [0, 0, 1] : [0, 1, 0];
      const ux = up[1] * cz - up[2] * cy;
      const uy = up[2] * cx - up[0] * cz;
      const uz = up[0] * cy - up[1] * cx;
      const uLen = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1;
      const u = [ux / uLen, uy / uLen, uz / uLen];

      const vx = cy * u[2] - cz * u[1];
      const vy = cz * u[0] - cx * u[2];
      const vz = cx * u[1] - cy * u[0];

      top5.sort((p1, p2) => {
        const d1x = p1.v[0] - cx;
        const d1y = p1.v[1] - cy;
        const d1z = p1.v[2] - cz;
        const ang1 = Math.atan2(
          d1x * vx + d1y * vy + d1z * vz,
          d1x * u[0] + d1y * u[1] + d1z * u[2]
        );

        const d2x = p2.v[0] - cx;
        const d2y = p2.v[1] - cy;
        const d2z = p2.v[2] - cz;
        const ang2 = Math.atan2(
          d2x * vx + d2y * vy + d2z * vz,
          d2x * u[0] + d2y * u[1] + d2z * u[2]
        );

        return ang1 - ang2;
      });

      return top5.map((p) => p.idx);
    });

    return { vertices, faces, isCurve: false };
  }

  // Torus Knot (p=2, q=3 trefoil knot)
  const N = 84;
  const vertices: [number, number, number][] = [];
  const segments: [number, number][] = [];

  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const r = Math.cos(3 * t) + 2.0;
    const x = r * Math.cos(2 * t);
    const y = r * Math.sin(2 * t);
    const z = -Math.sin(3 * t) * 1.5;
    // Normalize to approx radius 1
    vertices.push([x / 3.0, y / 3.0, z / 3.0]);
    segments.push([i, (i + 1) % N]);
  }

  return { vertices, faces: [], segments, isCurve: true };
}

function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

/**
 * Backward compatibility wrappers
 */
export function Icosahedron3D() {
  return (
    <RotatingPolyhedron3D
      type="icosahedron"
      size={140}
      speed={{ x: 0.007, y: 0.010, z: 0.004 }}
      glowColor="#f43f5e"
    />
  );
}

export function Octahedron3D() {
  return (
    <RotatingPolyhedron3D
      type="octahedron"
      size={130}
      speed={{ x: -0.009, y: 0.011, z: -0.005 }}
      glowColor="#e11d48"
    />
  );
}

export function Dodecahedron3D() {
  return (
    <RotatingPolyhedron3D
      type="dodecahedron"
      size={140}
      speed={{ x: 0.008, y: -0.009, z: 0.005 }}
      glowColor="#fb7185"
    />
  );
}

export function TorusKnot3D() {
  return (
    <RotatingPolyhedron3D
      type="torusKnot"
      size={135}
      speed={{ x: 0.010, y: 0.012, z: 0.006 }}
      glowColor="#f43f5e"
    />
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
