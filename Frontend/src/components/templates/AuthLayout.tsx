import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** Small ticket-row skeleton used inside the mock app window on the decorative side. */
function MockTicketRow({ color, width }: { color: string; width: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
      <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
      <span className={`h-2 rounded-full bg-slate-200 ${width}`} />
      <span className="ml-auto h-4 w-14 shrink-0 rounded-full bg-slate-100" />
    </div>
  );
}

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Form side */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-10 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white shadow-lg shadow-indigo-600/30">
              T
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-500">TicketDesk</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
              {description && <p className="mt-1.5 text-sm text-slate-500">{description}</p>}
            </div>
          </div>
          {children}
        </div>
      </div>

      {/* Decorative side - hidden on small screens, no form content lives here */}
      <div
        aria-hidden="true"
        className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-linear-to-br from-indigo-50 via-white to-violet-100 lg:flex"
      >
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-violet-200/50 blur-3xl" />

        <div className="relative flex w-full max-w-md flex-col items-center px-10">
          <div className="relative w-full">
            {/* Main mock app window */}
            <div className="shadow-elevated w-full rounded-2xl border border-slate-200/80 bg-white p-4">
              <div className="mb-3 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>
              <div className="flex flex-col gap-2">
                <MockTicketRow color="bg-indigo-400" width="w-24" />
                <MockTicketRow color="bg-amber-400" width="w-32" />
                <MockTicketRow color="bg-emerald-400" width="w-20" />
                <MockTicketRow color="bg-violet-400" width="w-28" />
              </div>
            </div>

            {/* Floating status cards */}
            <div className="shadow-elevated absolute -top-6 -right-8 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                ✓
              </span>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-900">Resolved</p>
                <p className="text-[11px] text-slate-400">Just now</p>
              </div>
            </div>
            <div className="shadow-elevated absolute -bottom-6 -left-10 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                ⏱
              </span>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-900">In progress</p>
                <p className="text-[11px] text-slate-400">Assigned to Amit</p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Every ticket, tracked end to end.
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Log issues, route them to the right department, and keep every request moving from
              open to resolved - all in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
