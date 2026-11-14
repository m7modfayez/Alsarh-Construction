import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireDashboardAdminIdentity } from "@/lib/server/supabase-admin";
import DashboardShell from "./dashboard-shell";

/** Require a valid authenticated Supabase user before rendering dashboard pages. */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const access = await requireDashboardAdminIdentity();
  if (!access.authorized) redirect("/login");

  return <DashboardShell>{children}</DashboardShell>;
}
