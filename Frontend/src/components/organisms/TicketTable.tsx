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
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">
                Title
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">
                Priority
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">
                Department
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">
                Creator
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">
                Assignee
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <tr key={ticket.ticketId} className="hover:bg-slate-50">
                <td className="max-w-xs px-4 py-3">
                  <Link
                    to={`/tickets/${ticket.ticketId}`}
                    className="line-clamp-1 font-medium text-slate-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
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
                <td className="px-4 py-3 text-slate-600">
                  {ticket.department?.departmentName ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{fullName(ticket.createdBy)}</td>
                <td className="px-4 py-3 text-slate-600">{fullName(ticket.assignedTo)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-500">
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
              className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              <p className="line-clamp-2 font-medium text-slate-900">{ticket.title}</p>
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
                  <dt>Assignee</dt>
                  <dd className="truncate text-right text-slate-700">
                    {fullName(ticket.assignedTo)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Created</dt>
                  <dd className="text-right text-slate-700">{formatDate(ticket.createdAt)}</dd>
                </div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
