import type { ReactNode } from "react";

export type BadgeColor = "slate" | "blue" | "amber" | "purple" | "green" | "red" | "gray";

interface BadgeProps {
  color?: BadgeColor;
  children: ReactNode;
  className?: string;
}

const COLOR_CLASSES: Record<BadgeColor, string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-600/20",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  purple: "bg-purple-50 text-purple-700 ring-purple-600/20",
  green: "bg-green-50 text-green-700 ring-green-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  gray: "bg-gray-100 text-gray-600 ring-gray-500/20",
};

export function Badge({ color = "slate", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${COLOR_CLASSES[color]} ${className}`}
    >
      {children}
    </span>
  );
}
