import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Department } from "../../types/department";
import { fullName } from "../../utils/format";

interface DepartmentTableProps {
  departments: Department[];
  renderActions?: (department: Department) => ReactNode;
}

export function DepartmentTable({ departments, renderActions }: DepartmentTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">
                Name
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">
                Email
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">
                Manager
              </th>
              {renderActions && (
                <th scope="col" className="px-4 py-3 text-right font-medium text-slate-600">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.map((department) => (
              <tr key={department.departmentId} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    to={`/departments/${department.departmentId}`}
                    className="font-medium text-slate-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  >
                    {department.departmentName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{department.departmentEmail}</td>
                <td className="px-4 py-3 text-slate-600">
                  {department.manager ? fullName(department.manager) : "Unmanaged"}
                </td>
                {renderActions && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">{renderActions(department)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {departments.map((department) => (
          <li key={department.departmentId} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <Link
                to={`/departments/${department.departmentId}`}
                className="font-medium text-slate-900 hover:underline"
              >
                {department.departmentName}
              </Link>
              {renderActions && <div className="flex gap-1">{renderActions(department)}</div>}
            </div>
            <p className="truncate text-sm text-slate-500">{department.departmentEmail}</p>
            <p className="mt-2 text-xs text-slate-500">
              Manager: {department.manager ? fullName(department.manager) : "Unmanaged"}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
