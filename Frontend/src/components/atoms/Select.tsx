import type { SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
}

export function Select({
  options,
  placeholder,
  invalid = false,
  className = "",
  ...rest
}: SelectProps) {
  return (
    <select
      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/40 disabled:bg-slate-100 disabled:text-slate-500 ${
        invalid ? "border-red-400" : "border-slate-300"
      } ${className}`}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
