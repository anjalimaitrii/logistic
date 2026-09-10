// Admin panel account type — comes from the backend on login (ADMIN_* vs EMPLOYEE_* env slots)
// and is stored in localStorage. Both types carry role "admin"; this only gates sidebar tabs.
export type AdminAccountType = "admin" | "employee";

export const ADMIN_ACCOUNT_TYPE_KEY = "adminAccountType";

export function getAdminAccountType(): AdminAccountType {
  if (typeof window === "undefined") return "admin";
  return localStorage.getItem(ADMIN_ACCOUNT_TYPE_KEY) === "employee" ? "employee" : "admin";
}

/**
 * What to call this account on screen. Both types sign in through the same panel
 * and carry role "admin", so the label was hardcoded as "Fleet Admin" — which
 * told an employee they were the administrator.
 */
export function adminRoleLabel(type: AdminAccountType): string {
  return type === "employee" ? "Employee" : "Fleet Admin";
}
