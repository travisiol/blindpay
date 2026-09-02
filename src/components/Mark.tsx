import { MARK_H, MARK_PATH, MARK_VIEWBOX, MARK_W } from "@/lib/mark";

export function Mark({
  size = 34,
  className,
  title,
  /** Stroke the outline first, then fade the fill in. Used by the preloader. */
  draw = false,
}: {
  size?: number;
  className?: string;
  title?: string;
  draw?: boolean;
}) {
  return (
    <svg
      width={size}
      height={(size * MARK_H) / MARK_W}
      viewBox={MARK_VIEWBOX}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {draw ? (
        <path
          className="eye-draw"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          fillRule="evenodd"
          d={MARK_PATH}
        />
      ) : null}
      <path
        className={draw ? "eye-fill" : undefined}
        fill="currentColor"
        fillRule="evenodd"
        d={MARK_PATH}
      />
    </svg>
  );
}
