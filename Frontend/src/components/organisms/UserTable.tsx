import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { User } from "../../types/user";
import { Badge } from "../atoms/Badge";
import { ROLE_LABELS } from "../../constants/options";
import { fullName } from "../../utils/format";

interface UserTableProps {
  users: User[];
  renderActions?: (user: User) => ReactNode;
}

export function UserTable({ users, renderActions }: UserTableProps) {
  return (
    <>
      <div className="shadow-soft hidden overflow-x-auto rounded-xl border border-slate-200/80 bg-white md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-slate-700">
                Name
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-slate-700">
                Email
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-slate-700">
                Role
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-slate-700">
                Department
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-slate-700">
                Verified
              </th>
              {renderActions && (
                <th scope="col" className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide text-slate-700">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    to={`/users/${user.id}`}
                    className="font-medium text-slate-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  >
                    {fullName(user)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge color={user.role === "super_admin" ? "purple" : user.role === "admin" ? "blue" : "slate"}>
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {user.department?.departmentName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge color={user.isVerified ? "green" : "amber"}>
                    {user.isVerified ? "Verified" : "Unverified"}
                  </Badge>
                </td>
                {renderActions && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">{renderActions(user)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {users.map((user) => (
          <li
            key={user.id}
            className="shadow-soft rounded-xl border border-slate-200/80 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <Link
                to={`/users/${user.id}`}
                className="font-medium text-slate-900 hover:underline"
              >
                {fullName(user)}
              </Link>
              {renderActions && <div className="flex gap-1">{renderActions(user)}</div>}
            </div>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge color={user.role === "super_admin" ? "purple" : user.role === "admin" ? "blue" : "slate"}>
                {ROLE_LABELS[user.role]}
              </Badge>
              <Badge color={user.isVerified ? "green" : "amber"}>
                {user.isVerified ? "Verified" : "Unverified"}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Department: {user.department?.departmentName ?? "—"}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
