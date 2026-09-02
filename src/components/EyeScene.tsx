"use client";

import { useEffect, useRef } from "react";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const MID = 330;

/**
 * The lid, as one path from wide open (0) to shut (1). Both halves converge
 * on the same line through the middle, so the eye closes rather than
 * shrinking.
 */
function eyePath(t: number): string {
  const upperOuter = lerp(110, MID - 8, t);
  const upperInner = lerp(60, MID - 10, t);
  const lowerOuter = lerp(550, MID + 7, t);
  const lowerInner = lerp(600, MID + 8, t);
  return `M40 330 C 200 ${upperOuter} 420 ${upperInner} 600 ${upperInner} C 780 ${upperInner} 1000 ${upperOuter} 1160 330 C 1000 ${lowerOuter} 780 ${lowerInner} 600 ${lowerInner} C 420 ${lowerInner} 200 ${lowerOuter} 40 330 Z`;
}

const SPARK =
  "M600 74 C 618 252 650 300 760 330 C 650 360 618 408 600 586 C 582 408 550 360 440 330 C 550 300 582 252 600 74 Z";

/**
 * The eye watches the cursor and shuts when you reach for it. Every frame
 * writes attributes straight onto the SVG nodes: this runs at 60fps and has
 * no business re-rendering React.
 */
export function EyeScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const boost = useRef<HTMLDivElement>(null);
  const irisGroup = useRef<SVGGElement>(null);
  const iris = useRef<SVGEllipseElement>(null);
  const sparkGroup = useRef<SVGGElement>(null);
  const sparkFade = useRef<SVGGElement>(null);
  const lid = useRef<SVGPathElement>(null);
  const lidMask = useRef<SVGPathElement>(null);
  const lidClip = useRef<SVGPathElement>(null);
  const closing = useRef(false);

  useEffect(() => {
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let shut = 0;
    let frame = 0;

    const onMove = (event: MouseEvent) => {
      targetX = (event.clientX / innerWidth - 0.5) * 2;
      targetY = (event.clientY / innerHeight - 0.5) * 2;
    };

    const tick = () => {
      if (!still) {
        x += (targetX - x) * 0.09;
        y += (targetY - y) * 0.09;
      }
      const want = closing.current ? 1 : 0;
      shut += (want - shut) * 0.22;
      if (Math.abs(want - shut) < 0.004) shut = want;

      const shift = `translate(${x * 36} ${y * 22})`;
      irisGroup.current?.setAttribute("transform", shift);
      sparkGroup.current?.setAttribute("transform", shift);

      const d = eyePath(shut);
      lid.current?.setAttribute("d", d);
      lidMask.current?.setAttribute("d", d);
      lidClip.current?.setAttribute("d", d);
      // The iris flattens with the lid, so nothing pokes through the seam.
      iris.current?.setAttribute("ry", String(272 * Math.max(0, 1 - shut * 1.25)));

      const fade = String(Math.max(0, 1 - shut * 1.9));
      sparkFade.current?.setAttribute("opacity", fade);
      if (boost.current) {
        const scale = (wrap.current?.clientWidth ?? 0) / 1200;
        boost.current.style.opacity = fade;
        boost.current.style.transform = `translate(calc(-50% + ${x * 36 * scale}px), calc(-50% + ${y * 22 * scale}px))`;
      }
      frame = requestAnimationFrame(tick);
    };

    addEventListener("mousemove", onMove);
    frame = requestAnimationFrame(tick);
    return () => {
      removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={wrap}
      className="scene-eye"
      onMouseEnter={() => {
        closing.current = true;
      }}
      onMouseLeave={() => {
        closing.current = false;
      }}
    >
      <div ref={boost} className="iris-boost" aria-hidden="true" />
      <svg viewBox="0 0 1200 660" aria-hidden="true">
        <defs>
          <clipPath id="scene-almond">
            <path ref={lidClip} d={eyePath(0)} />
          </clipPath>
          <radialGradient id="scene-sclera" cx="50%" cy="44%" r="62%">
            <stop offset="0%" stopColor="#f4f2ee" />
            <stop offset="72%" stopColor="#dedcd7" />
            <stop offset="100%" stopColor="#a8a5a0" />
          </radialGradient>
          <mask id="scene-iris-hole" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="660">
            <path ref={lidMask} d={eyePath(0)} fill="#fff" />
            <g ref={irisGroup}>
              <ellipse ref={iris} cx="600" cy="330" rx="272" ry="272" fill="#000" />
            </g>
          </mask>
        </defs>

        <path ref={lid} d={eyePath(0)} fill="url(#scene-sclera)" mask="url(#scene-iris-hole)" />
        <g clipPath="url(#scene-almond)">
          <g ref={sparkFade}>
            <g ref={sparkGroup}>
              <path className="eye-star" d={SPARK} fill="#f1efe9" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
