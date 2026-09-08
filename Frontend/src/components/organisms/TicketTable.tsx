import { Link } from "react-router-dom";
import type { Ticket } from "../../types/ticket";
import { StatusBadge } from "../molecules/StatusBadge";
import { PriorityBadge } from "../molecules/PriorityBadge";
import { formatDate, fullName } from "../../utils/format";

interface TicketTableProps {
  tickets: Ticket[];
}

export function TicketTable({ tickets }: TicketTableProps) {
  return (
    <>
      {/* Desktop / tablet table */}
      <div className="shadow-soft hidden overflow-x-auto rounded-xl border border-slate-200/80 bg-white md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-slate-700"
              >
                Title
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-slate-700"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-slate-700"
              >
                Priority
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-slate-700"
              >
                Department
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-slate-700"
              >
                Creator
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-slate-700"
              >
                AssignedTo
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-slate-700"
              >
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <tr key={ticket.ticketId} className="transition-colors hover:bg-slate-50">
                <td className="max-w-xs px-4 py-3">
                  <Link
                    to={`/tickets/${ticket.ticketId}`}
                    className="line-clamp-1 font-medium text-slate-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  >
                    {ticket.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {ticket.department?.departmentName ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {fullName(ticket.createdBy)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {fullName(ticket.assignedTo)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                  {formatDate(ticket.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {tickets.map((ticket) => (
          <li key={ticket.ticketId}>
            <Link
              to={`/tickets/${ticket.ticketId}`}
              className="shadow-soft block rounded-xl border border-slate-200/80 bg-white p-4 transition-colors hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              <p className="line-clamp-2 font-medium text-slate-900">
                {ticket.title}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
              <dl className="mt-3 space-y-1 text-xs text-slate-500">
                <div className="flex justify-between gap-2">
                  <dt>Department</dt>
                  <dd className="truncate text-right text-slate-700">
                    {ticket.department?.departmentName ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>AssignedTo</dt>
                  <dd className="truncate text-right text-slate-700">
                    {fullName(ticket.assignedTo)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Created</dt>
                  <dd className="text-right text-slate-700">
                    {formatDate(ticket.createdAt)}
                  </dd>
                </div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
