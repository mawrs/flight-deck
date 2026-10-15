export const ROLES = ["Admin", "Underwriter", "SLA", "Viewer"] as const;

export type Role = (typeof ROLES)[number];

export const CURRENT_ACCOUNT = {
  username: "demo",
  fullName: "Demo Account",
  email: "demo@southeastbank.com",
  roles: ["Admin"] as Role[],
};

export function accountHasRole(role: Role) {
  return CURRENT_ACCOUNT.roles.includes(role);
}
