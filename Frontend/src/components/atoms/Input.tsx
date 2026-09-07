import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid = false, className = "", ...rest }: InputProps) {
  return (
    <input
      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-shadow placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:bg-slate-100 disabled:text-slate-500 disabled:shadow-none ${
        invalid ? "border-red-400 focus:border-red-500 focus:ring-red-500/30" : "border-slate-300 hover:border-slate-400"
      } ${className}`}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}
