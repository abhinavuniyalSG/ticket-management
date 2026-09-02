import type { Ticket } from "../../types/ticket";
import { formatDate, fullName } from "../../utils/format";

interface TicketMetaProps {
  ticket: Ticket;
  className?: string;
}

export function TicketMeta({ ticket, className = "" }: TicketMetaProps) {
  const rows: Array<[string, string]> = [
    ["Department", ticket.department?.departmentName ?? "—"],
    ["Creator", fullName(ticket.createdBy)],
    ["Assignee", fullName(ticket.assignedTo)],
    ["Created", formatDate(ticket.createdAt)],
    ["Updated", formatDate(ticket.updatedAt)],
    ["Closed", formatDate(ticket.closedAt)],
  ];

  return (
    <dl className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
          <dd className="mt-0.5 truncate text-sm text-slate-800" title={value}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
