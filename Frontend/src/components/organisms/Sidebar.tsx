import { NavLink } from "react-router-dom";
import { getNavItemsForRole } from "../../constants/navigation";
import { ROLE_LABELS } from "../../constants/options";
import { useAuth } from "../../hooks/useAuth";
import { useLogout } from "../../hooks/useLogout";
import { fullName, initials } from "../../utils/format";
import { LOGOUT_ICON, NAV_ICONS } from "./navIcons";
import { Button } from "../atoms/Button";

export function Sidebar() {
  const { user } = useAuth();
  const handleLogout = useLogout();

  if (!user) return null;
  const items = getNavItemsForRole(user.role);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm shadow-indigo-600/30">
          T
        </span>
        <span className="text-lg font-semibold tracking-tight text-slate-900">TicketDesk</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`
            }
          >
            {NAV_ICONS[item.to]}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-50 p-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-200 to-slate-300 text-sm font-semibold text-slate-700">
            {initials(user)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{fullName(user)}</p>
            <p className="truncate text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
        <Button type="button" variant="secondary" className="w-full" onClick={() => void handleLogout()}>
          {LOGOUT_ICON}
          Log out
        </Button>
      </div>
    </aside>
  );
}
