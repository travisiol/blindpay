"use client";

import { useMemo } from "react";
import QRCode from "qrcode";
import { MARK_H, MARK_PATH, MARK_VIEWBOX, MARK_W } from "@/lib/mark";

const rounded = (x: number, y: number, w: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${w - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(w - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;

/**
 * The invoice QR as SVG, so it survives any print size. Modules are dots,
 * the finders are rounded squares, and the mark sits in a hole in the
 * middle — which is why the error correction level is the highest one.
 */
export function QrCode({ value }: { value: string }) {
  const qr = useMemo(() => {
    try {
      return QRCode.create(value, { errorCorrectionLevel: "H" });
    } catch {
      return null;
    }
  }, [value]);
  if (!qr) return null;

  const size = qr.modules.size;
  const data = qr.modules.data;
  const quiet = 4;
  const total = size + quiet * 2;
  const hole = Math.max(5, Math.round(size * 0.22));
  const h0 = Math.floor((size - hole) / 2);
  const h1 = h0 + hole;
  const inFinder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);

  const dots: string[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!data[y * size + x]) continue;
      if (x >= h0 && x < h1 && y >= h0 && y < h1) continue;
      if (inFinder(x, y)) continue;
      dots.push(
        `M${x + quiet + 0.5} ${y + quiet + 0.04}a0.46 0.46 0 1 0 0 0.92a0.46 0.46 0 1 0 0-0.92`,
      );
    }
  }

  const finders: string[] = [];
  for (const [fx, fy] of [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ]) {
    const x = fx + quiet;
    const y = fy + quiet;
    finders.push(
      rounded(x, y, 7, 0.5) + rounded(x + 1, y + 1, 5, 0.3),
      rounded(x + 2, y + 2, 3, 0.2),
    );
  }

  const logo = hole * 0.82;
  const logoH = (logo * MARK_H) / MARK_W;
  const lx = quiet + h0 + (hole - logo) / 2;
  const ly = quiet + h0 + (hole - logoH) / 2;

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width="100%"
      height="100%"
      shapeRendering="geometricPrecision"
      role="img"
      aria-label="Invoice QR code"
    >
      <path d={dots.join("")} fill="currentColor" />
      <path d={finders.join("")} fill="currentColor" fillRule="evenodd" />
      <svg x={lx} y={ly} width={logo} height={logoH} viewBox={MARK_VIEWBOX}>
        <path d={MARK_PATH} fill="currentColor" fillRule="evenodd" />
      </svg>
    </svg>
  );
}
