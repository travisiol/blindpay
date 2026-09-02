const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconFile = () => (
  <svg {...base}>
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v6h6M9 13h6M9 17h4" />
  </svg>
);

export const IconDownload = () => (
  <svg {...base}>
    <path d="M12 3v11" />
    <path d="M8 10l4 4 4-4" />
    <path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </svg>
);

export const IconCopy = () => (
  <svg {...base}>
    <rect x="9" y="9" width="12" height="12" rx="2.5" />
    <path d="M6 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2" />
  </svg>
);

export const IconCheck = () => (
  <svg {...base}>
    <path d="M4 12.5l5.2 5.2L20 7" />
  </svg>
);

export const IconUpload = () => (
  <svg {...base}>
    <path d="M12 3v13" />
    <path d="M8 7l4-4 4 4" />
    <path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />
  </svg>
);

export const IconWallet = () => (
  <svg {...base}>
    <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" />
    <rect x="3" y="7" width="18" height="13" rx="2.5" />
    <path d="M16 13.5h2.5" />
  </svg>
);

export const IconSend = () => (
  <svg {...base}>
    <path d="M21 3L10.5 13.5" />
    <path d="M21 3l-6.8 18-3.7-7.5L3 9.8 21 3z" />
  </svg>
);

export const IconBack = () => (
  <svg {...base}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const IconExternal = () => (
  <svg {...base}>
    <path d="M14 4h6v6" />
    <path d="M20 4l-9 9" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);

export const IconX = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
    <path d="M13.9 10.5 21.2 2h-1.7l-6.4 7.4L8 2H2.1l7.7 11.2L2.1 22h1.7l6.7-7.8 5.4 7.8h5.9l-8-11.5Zm-2.4 2.8-.8-1.1-6.2-8.9h2.7l5 7.2.8 1.1 6.5 9.3h-2.7l-5.3-7.6Z" />
  </svg>
);
