import type { UserRole } from "../types/user";

export interface NavItem {
  label: string;
  to: string;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", roles: ["admin", "super_admin"] },
  { label: "Tickets", to: "/tickets", roles: ["user", "admin", "super_admin"] },
  { label: "Users", to: "/users", roles: ["admin", "super_admin"] },
  { label: "Departments", to: "/departments", roles: ["super_admin"] },
  { label: "Profile", to: "/profile", roles: ["user", "admin", "super_admin"] },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function getDefaultRouteForRole(role: UserRole): string {
  return role === "user" ? "/tickets" : "/dashboard";
}
