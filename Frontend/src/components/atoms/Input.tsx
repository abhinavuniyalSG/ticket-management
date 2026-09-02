import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid = false, className = "", ...rest }: InputProps) {
  return (
    <input
      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/40 disabled:bg-slate-100 disabled:text-slate-500 ${
        invalid ? "border-red-400" : "border-slate-300"
      } ${className}`}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}
