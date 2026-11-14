import { NextResponse } from "next/server";
import { dashboardAdminDeniedResponse, requireDashboardAdmin } from "@/lib/server/supabase-admin";
import {
  deleteProjectMutation,
  projectMutationError,
  saveProjectMutation,
} from "@/lib/server/project-management";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const context = await requireDashboardAdmin();
    if (!context.authorized) return dashboardAdminDeniedResponse(context);
    const { id } = await params;
    return await saveProjectMutation(request, context.admin, true, id);
  } catch (error) {
    return projectMutationError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const context = await requireDashboardAdmin();
    if (!context.authorized) return dashboardAdminDeniedResponse(context);
    const { id } = await params;
    return await deleteProjectMutation(id, context.admin);
  } catch (error) {
    return projectMutationError(error);
  }
}
