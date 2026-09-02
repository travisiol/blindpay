/**
 * The mark: an almond eye with a four-point spark cut out of it, drawn with
 * `fillRule="evenodd"` so the spark reads as the pupil. One path, so the
 * same geometry serves the nav, the preloader (stroked, then filled), the
 * QR code's centre and the generated icons.
 */
export const MARK_VIEWBOX = "0 0 480 264";
export const MARK_W = 480;
export const MARK_H = 264;

const ALMOND = "M6 132 C 120 6 360 6 474 132 C 360 258 120 258 6 132 Z";
const SPARK =
  "M240 30 C 253 99 276 122 345 132 C 276 142 253 165 240 234 C 227 165 204 142 135 132 C 204 122 227 99 240 30 Z";

export const MARK_PATH = `${ALMOND} ${SPARK}`;

/** Standalone SVG markup, for `ImageResponse` and anywhere a data URI is needed. */
export function markSvg(fill: string, background?: string): string {
  const bg = background
    ? `<rect width="${MARK_W}" height="${MARK_H}" fill="${background}"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}">${bg}<path fill="${fill}" fill-rule="evenodd" d="${MARK_PATH}"/></svg>`;
}

export function markDataUri(fill: string, background?: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(markSvg(fill, background))}`;
}
