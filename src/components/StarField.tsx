"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  base: number;
  speed: number;
  phase: number;
  life: number;
  ttl: number;
};

const COUNT = 150;
const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * The sky. Stars twinkle on their own clocks, fade out and are reborn
 * elsewhere, and every few seconds one falls. Canvas rather than DOM: 150
 * elements re-rendered per frame would be a different kind of page.
 */
export function StarField() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const born = (): Star => ({
      x: Math.random(),
      // Squashed towards the top: the lower third is ground, not sky.
      y: Math.pow(Math.random(), 1.6) * 0.66,
      r: rand(0.5, 1.7),
      base: rand(0.25, 0.9),
      speed: rand(0.6, 2.2),
      phase: rand(0, Math.PI * 2),
      life: 1,
      ttl: rand(6, 40),
    });
    const stars: Star[] = Array.from({ length: COUNT }, born);

    let shooting: { x: number; y: number; vx: number; vy: number; age: number; span: number } | null =
      null;
    let nextShot = rand(4, 9);
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = el.clientWidth;
      h = el.clientHeight;
      el.width = w * dpr;
      el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener("resize", resize);

    let last = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      if (!w || !h) resize();
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      ctx.clearRect(0, 0, w, h);

      for (const star of stars) {
        if (!still) {
          star.ttl -= dt;
          if (star.ttl <= 0 && star.life <= 0.02) Object.assign(star, born(), { life: 0 });
          const target = star.ttl <= 0.8 ? 0 : 1;
          star.life += (target - star.life) * Math.min(dt * 2.2, 1);
        }
        const twinkle = still ? 1 : 0.62 + 0.38 * Math.sin((now / 1000) * star.speed + star.phase);
        const alpha = star.base * twinkle * star.life;
        if (alpha < 0.02) continue;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#eef2ec";
        ctx.beginPath();
        ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!still) {
        nextShot -= dt;
        if (!shooting && nextShot <= 0) {
          shooting = {
            x: rand(0.15, 0.95),
            y: rand(0.04, 0.22),
            vx: rand(-0.34, -0.22),
            vy: rand(0.1, 0.16),
            age: 0,
            span: rand(0.6, 0.9),
          };
          nextShot = rand(6, 14);
        }
        if (shooting) {
          shooting.age += dt;
          shooting.x += shooting.vx * dt;
          shooting.y += shooting.vy * dt;
          const progress = shooting.age / shooting.span;
          const fade = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
          if (progress >= 1) {
            shooting = null;
          } else {
            const x = shooting.x * w;
            const y = shooting.y * h;
            const len = 90 * fade;
            const angle = Math.atan2(shooting.vy, shooting.vx);
            const tail = ctx.createLinearGradient(
              x,
              y,
              x - Math.cos(angle) * len,
              y - Math.sin(angle) * len,
            );
            tail.addColorStop(0, `rgba(238, 242, 236, ${0.85 * fade})`);
            tail.addColorStop(1, "rgba(238, 242, 236, 0)");
            ctx.globalAlpha = 1;
            ctx.strokeStyle = tail;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - Math.cos(angle) * len, y - Math.sin(angle) * len);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      if (!still) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    draw(last);

    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvas} className="star-field" aria-hidden="true" />;
}
