import type { Ticket } from "../../types/ticket";
import { formatDate, fullName } from "../../utils/format";

interface TicketMetaProps {
  ticket: Ticket;
  className?: string;
  /** "grid" (default) lays out cards responsively; "list" stacks rows for narrow containers like a sidebar. */
  variant?: "grid" | "list";
}

export function TicketMeta({ ticket, className = "", variant = "grid" }: TicketMetaProps) {
  const rows: Array<[string, string]> = [
    ["Department", ticket.department?.departmentName ?? "—"],
    ["Creator", fullName(ticket.createdBy)],
    ["AssignedTo", fullName(ticket.assignedTo)],
    ["Created", formatDate(ticket.createdAt)],
    ["Updated", formatDate(ticket.updatedAt)],
    ["Closed", formatDate(ticket.closedAt)],
  ];

  if (variant === "list") {
    return (
      <dl className={`flex flex-col divide-y divide-slate-100 ${className}`}>
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="truncate text-right text-sm font-medium text-slate-800" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-2.5">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
          <dd className="mt-0.5 truncate text-sm text-slate-800" title={value}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
