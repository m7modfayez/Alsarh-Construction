import { NextResponse } from "next/server";
import { dashboardAdminDeniedResponse, requireDashboardAdmin } from "@/lib/server/supabase-admin";
import { projectMutationError, saveProjectMutation } from "@/lib/server/project-management";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const context = await requireDashboardAdmin();
    if (!context.authorized) return dashboardAdminDeniedResponse(context);
    return await saveProjectMutation(request, context.admin, false);
  } catch (error) {
    return projectMutationError(error);
  }
}
