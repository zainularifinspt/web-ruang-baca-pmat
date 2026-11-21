"use client";

import React, { useEffect, useRef } from "react";

/**
 * DesktopPolyhedronsBackdrop
 * Renders the 4 interactive 3D Platonic & Topological models on desktop viewports.
 * Dynamically loaded to prevent 3D canvas and vertex calculation overhead on mobile devices.
 */
export function DesktopPolyhedronsBackdrop() {
  return (
    <>
      {/* Top-Left: True 3D Rotating Icosahedron (Platonic Solid - 20 Triangles) */}
      <div className="pointer-events-auto hidden md:block absolute top-8 left-3 sm:left-8 lg:left-14 opacity-65 sm:opacity-85 hover:opacity-100 transition-all duration-300">
        <RotatingPolyhedron3D
          type="icosahedron"
          size={145}
          speed={{ x: 0.007, y: 0.010, z: 0.004 }}
          glowColor="#f43f5e"
          label="Ikosahedron 3D"
        />
      </div>

      {/* Top-Right: True 3D Rotating Dodecahedron (Platonic Solid - 12 Pentagons) */}
      <div className="pointer-events-auto hidden md:block absolute top-10 right-3 sm:right-8 lg:right-16 opacity-65 sm:opacity-85 hover:opacity-100 transition-all duration-300">
        <RotatingPolyhedron3D
          type="dodecahedron"
          size={145}
          speed={{ x: 0.008, y: -0.009, z: 0.005 }}
          glowColor="#fb7185"
          label="Dodekahedron 3D"
        />
      </div>

      {/* Mid-Left: True 3D Rotating Octahedron (Dual-Pyramid Diamond) */}
      <div className="pointer-events-auto hidden sm:block absolute top-52 left-6 lg:left-20 opacity-60 sm:opacity-80 hover:opacity-100 transition-all duration-300">
        <RotatingPolyhedron3D
          type="octahedron"
          size={135}
          speed={{ x: -0.009, y: 0.011, z: -0.005 }}
          glowColor="#e11d48"
          label="Oktahedron 3D"
        />
      </div>

      {/* Mid-Right: True 3D Rotating Torus Knot (Parametric Topology) */}
      <div className="pointer-events-auto hidden sm:block absolute top-48 right-6 lg:right-20 opacity-60 sm:opacity-80 hover:opacity-100 transition-all duration-300">
        <RotatingPolyhedron3D
          type="torusKnot"
          size={140}
          speed={{ x: 0.010, y: 0.012, z: 0.006 }}
          glowColor="#f43f5e"
          label="Torus Knot 3D"
        />
      </div>
    </>
  );
}

// Shared global pointer coordinates (Single passive listener for the entire window)
let sharedMouseX = typeof window !== "undefined" ? window.innerWidth * 0.5 : 0;
let sharedMouseY = typeof window !== "undefined" ? window.innerHeight * 0.5 : 0;
let hasSharedMouseMoved = false;
let globalPointerListenerAttached = false;

function initGlobalPointerTracking() {
  if (globalPointerListenerAttached || typeof window === "undefined") return;
  globalPointerListenerAttached = true;
  sharedMouseX = window.innerWidth * 0.5;
  sharedMouseY = window.innerHeight * 0.5;
  window.addEventListener(
    "pointermove",
    (e: PointerEvent) => {
      sharedMouseX = e.clientX;
      sharedMouseY = e.clientY;
      hasSharedMouseMoved = true;
    },
    { passive: true }
  );
}

/**
 * Mathematically Authentic 3D Rotating Polyhedron Canvas (60 FPS Locked & Zero-GC)
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
    initGlobalPointerTracking();
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    if (isMobile) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const geometry = getGeometry(type);
    const numVertices = geometry.vertices.length;

    const projected = new Array(numVertices);
    for (let i = 0; i < numVertices; i++) {
      projected[i] = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, scale: 1 };
    }

    const faceInfos = geometry.faces.map((face) => ({
      face,
      avgZ: 0,
      nz: 0,
      lightDot: 0,
    }));

    let angleX = Math.random() * Math.PI * 2;
    let angleY = Math.random() * Math.PI * 2;
    let angleZ = Math.random() * Math.PI * 2;

    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let dragVelocityX = 0;
    let dragVelocityY = 0;
    let isHovered = false;

    let cachedCenterX = 0;
    let cachedCenterY = 0;
    let cachedHalfW = 500;
    let cachedHalfH = 400;

    const updateCachedMetrics = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      cachedCenterX = rect.left + rect.width * 0.5;
      cachedCenterY = rect.top + rect.height * 0.5;
      cachedHalfW = window.innerWidth * 0.5 || 500;
      cachedHalfH = window.innerHeight * 0.5 || 400;
    };

    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(updateCachedMetrics);
      } else {
        setTimeout(updateCachedMetrics, 120);
      }
    }

    window.addEventListener("resize", updateCachedMetrics, { passive: true });

    let tiltX = 0;
    let tiltY = 0;

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
      updateCachedMetrics();
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

    let animId: number | null = null;
    let isVisible = !document.hidden;
    let isIntersecting = true;
    let lastTime = performance.now();

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && isIntersecting && !animId) {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === canvas) {
            const wasIntersecting = isIntersecting;
            isIntersecting = entry.isIntersecting;
            if (!wasIntersecting && isIntersecting && isVisible && !animId) {
              lastTime = performance.now();
              animId = requestAnimationFrame(render);
            }
          }
        }
      },
      { rootMargin: "60px" }
    );
    observer.observe(canvas);

    const cameraDistance = 3.4;
    const fov = 3.0;
    const radius = size * 0.44;

    let lastRenderTime = 0;

    const render = () => {
      if (!isVisible || !isIntersecting) {
        animId = null;
        return;
      }

      const now = performance.now();
      if (!isDragging && !isHovered && now - lastRenderTime < 32) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastRenderTime = now;

      const dt = Math.min((now - lastTime) / 16.667, 2.0);
      lastTime = now;

      if (isDragging) {
        // Handled in pointermove
      } else if (Math.abs(dragVelocityX) > 0.0001 || Math.abs(dragVelocityY) > 0.0001) {
        angleY += dragVelocityX * dt;
        angleX += dragVelocityY * dt;
        dragVelocityX *= Math.pow(0.94, dt);
        dragVelocityY *= Math.pow(0.94, dt);
        angleZ += speed.z * dt;
      } else {
        const ambientBoost = isHovered ? 1.4 : 1.0;
        angleX += speed.x * ambientBoost * dt;
        angleY += speed.y * ambientBoost * dt;
        angleZ += speed.z * dt;
      }

      if (hasSharedMouseMoved && !isDragging) {
        const dx = (sharedMouseX - cachedCenterX) / cachedHalfW;
        const dy = (sharedMouseY - cachedCenterY) / cachedHalfH;
        const targetTiltX = Math.max(-0.55, Math.min(0.55, dy * 0.55));
        const targetTiltY = Math.max(-0.55, Math.min(0.55, dx * 0.55));
        tiltX += (targetTiltX - tiltX) * (0.06 * dt);
        tiltY += (targetTiltY - tiltY) * (0.06 * dt);
      } else if (!isDragging) {
        tiltX += (0 - tiltX) * (0.04 * dt);
        tiltY += (0 - tiltY) * (0.04 * dt);
      }

      const effectiveAngleX = angleX + tiltX;
      const effectiveAngleY = angleY + tiltY;
      const effectiveAngleZ = angleZ;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, size, size);

      const parallaxShiftX = tiltY * 10;
      const parallaxShiftY = tiltX * 10;
      const cx = size * 0.5 + parallaxShiftX;
      const cy = size * 0.5 + parallaxShiftY;

      const cosX = Math.cos(effectiveAngleX);
      const sinX = Math.sin(effectiveAngleX);
      const cosY = Math.cos(effectiveAngleY);
      const sinY = Math.sin(effectiveAngleY);
      const cosZ = Math.cos(effectiveAngleZ);
      const sinZ = Math.sin(effectiveAngleZ);

      for (let i = 0; i < numVertices; i++) {
        const [vx, vy, vz] = geometry.vertices[i];
        const p = projected[i];

        const y1 = vy * cosX - vz * sinX;
        const z1 = vy * sinX + vz * cosX;
        const x2 = vx * cosY + z1 * sinY;
        const z2 = -vx * sinY + z1 * cosY;
        const x3 = x2 * cosZ - y1 * sinZ;
        const y3 = x2 * sinZ + y1 * cosZ;
        const z3 = z2;

        const depth = z3 + cameraDistance;
        const projScale = fov / depth;
        p.x = cx + x3 * radius * projScale;
        p.y = cy + y3 * radius * projScale;
        p.z = z3;
        p.rx = x3;
        p.ry = y3;
        p.rz = z3;
        p.scale = projScale;
      }

      if (geometry.isCurve && geometry.segments) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (let i = 0; i < geometry.segments.length; i++) {
          const [i0, i1] = geometry.segments[i];
          const p0 = projected[i0];
          const p1 = projected[i1];
          const avgZ = (p0.z + p1.z) * 0.5;
          const alpha = Math.max(0.12, Math.min(0.40, 0.22 + avgZ * 0.2));

          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.strokeStyle = `rgba(244, 63, 94, ${alpha})`;
          ctx.lineWidth = Math.max(3, 5.5 * p0.scale);
          ctx.stroke();
        }

        for (let i = 0; i < geometry.segments.length; i++) {
          const [i0, i1] = geometry.segments[i];
          const p0 = projected[i0];
          const p1 = projected[i1];
          const avgZ = (p0.z + p1.z) * 0.5;
          const alpha = Math.max(0.28, Math.min(1.0, 0.60 + avgZ * 0.45));

          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.strokeStyle = `rgba(254, 205, 211, ${alpha})`;
          ctx.lineWidth = Math.max(1, 2.2 * p0.scale);
          ctx.stroke();
        }

        for (let i = 0; i < numVertices; i += 3) {
          const p = projected[i];
          const nodeAlpha = Math.max(0.25, Math.min(1, 0.65 + p.z * 0.45));
          const r = Math.max(1.2, 2.2 * p.scale);

          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(244, 63, 94, ${nodeAlpha * 0.35})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${nodeAlpha})`;
          ctx.fill();
        }

        ctx.restore();
        animId = requestAnimationFrame(render);
        return;
      }

      const lightX = 0.35 + tiltY * 0.4;
      const lightY = -0.65 + tiltX * 0.4;
      const lightZ = 0.70;
      const lightInvLen = 1 / Math.sqrt(lightX * lightX + lightY * lightY + lightZ * lightZ);
      const lNormX = lightX * lightInvLen;
      const lNormY = lightY * lightInvLen;
      const lNormZ = lightZ * lightInvLen;

      for (let i = 0; i < faceInfos.length; i++) {
        const info = faceInfos[i];
        const face = info.face;
        let sumZ = 0;
        for (let j = 0; j < face.length; j++) sumZ += projected[face[j]].z;
        info.avgZ = sumZ / face.length;

        const p0 = projected[face[0]];
        const p1 = projected[face[1]];
        const p2 = projected[face[2]];

        const v1x = p1.rx - p0.rx;
        const v1y = p1.ry - p0.ry;
        const v1z = p1.rz - p0.rz;
        const v2x = p2.rx - p0.rx;
        const v2y = p2.ry - p0.ry;
        const v2z = p2.rz - p0.rz;

        const nx = v1y * v2z - v1z * v2y;
        const ny = v1z * v2x - v1x * v2z;
        const nz = v1x * v2y - v1y * v2x;
        const invLen = 1 / (Math.sqrt(nx * nx + ny * ny + nz * nz) || 1);
        const nNormX = nx * invLen;
        const nNormY = ny * invLen;
        const nNormZ = nz * invLen;

        info.nz = nNormZ;
        info.lightDot = Math.max(0, nNormX * lNormX + nNormY * lNormY + nNormZ * lNormZ);
      }

      faceInfos.sort((a, b) => a.avgZ - b.avgZ);

      for (let i = 0; i < faceInfos.length; i++) {
        const { face, nz, lightDot } = faceInfos[i];
        ctx.beginPath();
        const first = projected[face[0]];
        ctx.moveTo(first.x, first.y);
        for (let j = 1; j < face.length; j++) {
          const pt = projected[face[j]];
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();

        const isFront = nz > 0;
        if (isFront) {
          const baseAlpha = (isHovered || isDragging ? 0.24 : 0.16) + 0.32 * lightDot;
          ctx.fillStyle = `rgba(244, 63, 94, ${baseAlpha})`;
          ctx.fill();
        } else {
          ctx.fillStyle = "rgba(136, 19, 55, 0.08)";
          ctx.fill();
        }

        ctx.strokeStyle = isFront
          ? `rgba(254, 205, 211, ${0.38 + 0.38 * lightDot})`
          : "rgba(225, 29, 72, 0.14)";
        ctx.lineWidth = isFront ? (isHovered || isDragging ? 1.3 : 1.1) : 0.8;
        ctx.stroke();
      }

      for (let i = 0; i < numVertices; i++) {
        const pt = projected[i];
        const nodeAlpha = Math.max(0.3, Math.min(1, 0.65 + pt.z * 0.45));
        const r = Math.max(1.2, 2.2 * pt.scale);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244, 63, 94, ${nodeAlpha * 0.35})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${nodeAlpha})`;
        ctx.fill();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", updateCachedMetrics);
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
      className="group relative flex flex-col items-center justify-center transition-transform duration-300 hover:scale-110 will-change-transform transform-gpu"
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        className="block cursor-grab active:cursor-grabbing touch-none select-none drop-shadow-[0_0_16px_rgba(244,63,94,0.30)] group-hover:drop-shadow-[0_0_28px_rgba(244,63,94,0.55)] will-change-transform transform-gpu"
        style={{ width: size, height: size, touchAction: "none" }}
        title="Klik & geser untuk memutar objek 3D"
      />
      {label && (
        <span className="pointer-events-none absolute -bottom-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 apple-glass-pill px-2.5 py-0.5 text-[10px] font-bold text-rose-100 whitespace-nowrap shadow-md scale-90 group-hover:scale-100 border border-rose-400/30 bg-black/50 backdrop-blur-md">
          {label}
        </span>
      )}
    </div>
  );
}

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

  const N = 84;
  const vertices: [number, number, number][] = [];
  const segments: [number, number][] = [];

  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const r = Math.cos(3 * t) + 2.0;
    const x = r * Math.cos(2 * t);
    const y = r * Math.sin(2 * t);
    const z = -Math.sin(3 * t) * 1.5;
    vertices.push([x / 3.0, y / 3.0, z / 3.0]);
    segments.push([i, (i + 1) % N]);
  }

  return { vertices, faces: [], segments, isCurve: true };
}
