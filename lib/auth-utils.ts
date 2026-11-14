export type DashboardAuthorization = "unauthenticated" | "authorized";

/** Supabase auth.getUser() has already verified the session before this is called. */
export function getDashboardAuthorization(user: unknown): DashboardAuthorization {
  if (
    !user ||
    typeof user !== "object" ||
    typeof (user as { id?: unknown }).id !== "string" ||
    !(user as { id: string }).id.trim()
  ) {
    return "unauthenticated";
  }

  return "authorized";
}
