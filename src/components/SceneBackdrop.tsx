import { StarField } from "./StarField";

/**
 * Night desert under an aurora, drawn rather than filmed: dune ridges, a
 * green wash on the horizon, and the star field over the top. The shade and
 * fog layers sit above it to push the middle of the screen dark enough for
 * type.
 */
export function SceneBackdrop() {
  return (
    <>
      <svg
        className="landing-scene"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#040507" />
            <stop offset="52%" stopColor="#06080a" />
            <stop offset="74%" stopColor="#08100d" />
            <stop offset="100%" stopColor="#0a1a12" />
          </linearGradient>
          <radialGradient id="aurora" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1df33b" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#1df33b" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#1df33b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="aurora-far" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7ee31f" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7ee31f" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ridge-lit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c3a2c" />
            <stop offset="100%" stopColor="#0b0f0d" />
          </linearGradient>
        </defs>

        <rect width="1600" height="900" fill="url(#sky)" />

        {/* The aurora sits on the horizon line, brightest to the left. */}
        <ellipse cx="430" cy="612" rx="760" ry="150" fill="url(#aurora)" />
        <ellipse cx="1180" cy="596" rx="520" ry="104" fill="url(#aurora-far)" />

        {/* Far ridge, catching the glow. */}
        <path
          d="M0 618 C 190 578 360 640 548 612 C 742 583 892 632 1084 606 C 1288 578 1430 622 1600 596 L1600 900 L0 900 Z"
          fill="url(#ridge-lit)"
          opacity="0.85"
        />
        {/* Mid dunes. */}
        <path
          d="M0 706 C 250 660 470 730 706 694 C 944 658 1180 726 1600 678 L1600 900 L0 900 Z"
          fill="#080b0b"
        />
        {/* Near dune, the darkest mass. */}
        <path
          d="M0 812 C 300 762 640 836 980 794 C 1250 760 1420 806 1600 782 L1600 900 L0 900 Z"
          fill="#050607"
        />
      </svg>

      <StarField />
      <div className="landing-shade" aria-hidden="true" />
      <div className="landing-fog" aria-hidden="true" />
    </>
  );
}
