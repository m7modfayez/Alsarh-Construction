export function isAuthenticatedDashboardUser(user: unknown): user is { id: string } {
  return Boolean(user && typeof user === "object" && typeof (user as { id?: unknown }).id === "string" && (user as { id: string }).id);
}
