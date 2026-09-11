import type { ReactNode } from "react";

interface TooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/** Wraps an icon-only control with a small label that appears on hover/focus. */
export function Tooltip({ label, children, className = "" }: TooltipProps) {
  return (
    <span className={`group relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800/85 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity delay-150 duration-150 group-hover:opacity-100 group-has-focus-visible:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
