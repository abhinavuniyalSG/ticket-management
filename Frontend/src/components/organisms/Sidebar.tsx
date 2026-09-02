import { NavLink } from "react-router-dom";
import { getNavItemsForRole } from "../../constants/navigation";
import { ROLE_LABELS } from "../../constants/options";
import { useAuth } from "../../hooks/useAuth";
import { useLogout } from "../../hooks/useLogout";
import { fullName, initials } from "../../utils/format";

export function Sidebar() {
  const { user } = useAuth();
  const handleLogout = useLogout();

  if (!user) return null;
  const items = getNavItemsForRole(user.role);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
        <span className="text-lg font-semibold text-slate-900">TicketDesk</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
            {initials(user)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{fullName(user)}</p>
            <p className="truncate text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
