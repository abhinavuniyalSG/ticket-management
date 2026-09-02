import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { getNavItemsForRole } from "../../constants/navigation";
import { ROLE_LABELS } from "../../constants/options";
import { useAuth } from "../../hooks/useAuth";
import { useLogout } from "../../hooks/useLogout";
import { fullName } from "../../utils/format";

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
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
        tabIndex={-1}
      />
      <nav
        aria-label="Primary"
        className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl"
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <span className="text-lg font-semibold text-slate-900">TicketDesk</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
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
                `block rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="border-t border-slate-200 p-4">
          <p className="truncate text-sm font-medium text-slate-900">{fullName(user)}</p>
          <p className="mb-3 truncate text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </nav>
    </div>
  );
}
