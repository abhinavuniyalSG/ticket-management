import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: "default" | "danger";
}

export function IconButton({
  icon,
  label,
  variant = "default",
  className = "",
  ...rest
}: IconButtonProps) {
  const variantClasses =
    variant === "danger"
      ? "text-red-600 hover:bg-red-50 focus-visible:outline-red-600"
      : "text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-900";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${variantClasses} ${className}`}
      {...rest}
    >
      {icon}
    </button>
  );
}
