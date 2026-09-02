"use client";

import { useEffect, useRef } from "react";
import { Mark } from "./Mark";

const DURATION = 900;
/**
 * The longest the fonts get to answer. Without this cap a stalled request to
 * the font host leaves a visitor staring at the loading eye forever, since
 * `document.fonts.ready` simply never settles.
 */
const FONT_TIMEOUT = 2000;

/**
 * The eye draws itself while the fonts load, the bar fills, then the whole
 * thing fades out. Written against refs rather than state so the animation
 * frames never re-render the tree underneath it.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = now - start;
      if (bar.current) {
        bar.current.style.width = `${Math.min(96, 8 + (t / DURATION) * 88)}%`;
      }
      if (t < DURATION) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    let timer = 0;
    const fonts = Promise.race([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise((resolve) => setTimeout(resolve, FONT_TIMEOUT)),
    ]);
    void Promise.all([
      fonts,
      new Promise((resolve) => setTimeout(resolve, DURATION)),
    ]).then(() => {
      if (bar.current) bar.current.style.width = "100%";
      timer = window.setTimeout(() => root.current?.classList.add("gone"), 220);
    });

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="preloader" ref={root}>
      <div className="preloader-inner">
        <div className="eye-wrap">
          <Mark size={150} draw />
        </div>
        <div className="preloader-bar">
          <i ref={bar} style={{ width: "8%" }} />
        </div>
      </div>
    </div>
  );
}
