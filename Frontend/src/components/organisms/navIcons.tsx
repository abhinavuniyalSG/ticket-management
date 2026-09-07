import type { ReactNode } from "react";

const wrapperProps = {
  viewBox: "0 0 20 20",
  fill: "none",
  "aria-hidden": true,
  className: "h-[18px] w-[18px] shrink-0",
} as const;

/** Keyed by the nav item's route (`NavItem.to`). One simple line icon per section. */
export const NAV_ICONS: Record<string, ReactNode> = {
  "/dashboard": (
    <svg {...wrapperProps}>
      <path
        d="M3 9.5L10 4l7 5.5M5 8.5V16a1 1 0 001 1h2.5v-4.5h3V17H14a1 1 0 001-1V8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  "/tickets": (
    <svg {...wrapperProps}>
      <rect x="4" y="3" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7.5h6M7 10.5h6M7 13.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  "/users": (
    <svg {...wrapperProps}>
      <circle cx="7.3" cy="6.7" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 16c0-2.5 1.9-3.9 4.3-3.9s4.3 1.4 4.3 3.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="13.7" cy="7.2" r="1.7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.6 9.4c1.9.3 3.4 1.6 3.4 3.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  "/departments": (
    <svg {...wrapperProps}>
      <rect x="3.5" y="4" width="8" height="13" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12.5" y="8.5" width="4" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="5.8" y="6.5" width="1.4" height="1.4" fill="currentColor" />
      <rect x="9.3" y="6.5" width="1.4" height="1.4" fill="currentColor" />
      <rect x="5.8" y="10" width="1.4" height="1.4" fill="currentColor" />
      <rect x="9.3" y="10" width="1.4" height="1.4" fill="currentColor" />
    </svg>
  ),
  "/profile": (
    <svg {...wrapperProps}>
      <circle cx="10" cy="6.8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 16.5c.8-3.4 3.4-5.3 6.5-5.3s5.7 1.9 6.5 5.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};
