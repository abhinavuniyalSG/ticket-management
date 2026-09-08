import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ invalid = false, className = "", rows = 4, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={`w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 ${
        invalid ? "border-red-400 focus:border-red-500" : "border-slate-300 hover:border-slate-400"
      } ${className}`}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}
