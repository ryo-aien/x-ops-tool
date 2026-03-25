export type Role = "admin" | "approver" | "editor" | "viewer";

const roleHierarchy: Record<Role, number> = {
  admin: 4,
  approver: 3,
  editor: 2,
  viewer: 1,
};

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canApprove(role: Role): boolean {
  return hasPermission(role, "approver");
}

export function canEdit(role: Role): boolean {
  return hasPermission(role, "editor");
}

export function isAdmin(role: Role): boolean {
  return role === "admin";
}
