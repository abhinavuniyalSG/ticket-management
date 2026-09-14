import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Tooltip } from "./Tooltip";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  /** Accessible name (e.g. "Edit Jane Doe") - always used for screen readers,
   * even when `tooltip` overrides what's shown visually. */
  label: string;
  /** Short visible tooltip text (e.g. "Edit"). Defaults to `label` when omitted. */
  tooltip?: string;
  variant?: "default" | "primary" | "danger";
}

export function IconButton({
  icon,
  label,
  tooltip,
  variant = "default",
  className = "",
  ...rest
}: IconButtonProps) {
  const variantClasses =
    variant === "danger"
      ? "text-red-600 hover:bg-red-50 focus-visible:outline-red-600"
      : variant === "primary"
        ? "text-indigo-600 hover:bg-indigo-50 focus-visible:outline-indigo-600"
        : "text-slate-600 hover:bg-slate-100 focus-visible:outline-indigo-600";

  return (
    <Tooltip label={tooltip ?? label}>
      <button
        type="button"
        aria-label={label}
        className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 ${variantClasses} ${className}`}
        {...rest}
      >
        {icon}
      </button>
    </Tooltip>
  );
}
