"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 60;
const DRIFT_SPEED = 0.04;

type Particle = { x: number; y: number; r: number; opacity: number; dx: number; dy: number };

/**
 * Sparse, faint dot texture behind all page content — the reference
 * site's starfield-like background (confirmed: a single low-density
 * canvas layer, not CSS). Fixed position, pointer-events: none, and a
 * low, static particle count so this never competes with content or
 * costs noticeable CPU. Renders nothing until mounted (canvas needs a
 * real viewport size) and skips entirely if the user prefers reduced
 * motion — drift stays off, dots still render statically.
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let particles: Particle[] = [];

    function seed() {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.2 + 0.4,
        opacity: Math.random() * 0.35 + 0.1,
        dx: (Math.random() - 0.5) * DRIFT_SPEED,
        dy: (Math.random() - 0.5) * DRIFT_SPEED,
      }));
    }

    function resize() {
      // canvas/ctx are already guarded non-null above; TS can't carry that
      // narrowing into a function called later via an event listener, so
      // this reasserts what's structurally true for the component's lifetime.
      if (!canvas || !ctx) return;
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      seed();
    }

    resize();
    window.addEventListener("resize", resize);

    let rafId: number;
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#ffffff";
      for (const p of particles) {
        if (!prefersReducedMotion) {
          p.x += p.dx;
          p.y += p.dy;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!prefersReducedMotion) rafId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-field-canvas" aria-hidden="true" />;
}
