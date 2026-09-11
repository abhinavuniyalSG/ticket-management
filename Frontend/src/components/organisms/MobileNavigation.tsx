import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { getNavItemsForRole } from "../../constants/navigation";
import { ROLE_LABELS } from "../../constants/options";
import { useAuth } from "../../hooks/useAuth";
import { useLogout } from "../../hooks/useLogout";
import { fullName } from "../../utils/format";
import { LOGOUT_ICON, NAV_ICONS } from "./navIcons";
import { Button } from "../atoms/Button";

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const { user } = useAuth();
  const handleLogout = useLogout();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;
  const items = getNavItemsForRole(user.role);

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        tabIndex={-1}
      />
      <nav
        aria-label="Primary"
        className="shadow-elevated relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-white"
      >
        <div className="flex h-16 items-center gap-2 justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm shadow-indigo-600/30">
              T
            </span>
            <span className="text-lg font-semibold text-slate-900">TicketDesk</span>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
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
        </div>
        <div className="border-t border-slate-200 p-4">
          <p className="truncate text-sm font-medium text-slate-900">{fullName(user)}</p>
          <p className="mb-3 truncate text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
          <Button type="button" variant="secondary" className="w-full" onClick={() => void handleLogout()}>
            {LOGOUT_ICON}
            Log out
          </Button>
        </div>
      </nav>
    </div>
  );
}
