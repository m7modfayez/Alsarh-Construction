import { NextResponse } from "next/server";
import { requireDashboardUser } from "@/lib/server/supabase-admin";
import { projectMutationError, saveProjectMutation } from "@/lib/server/project-management";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const context = await requireDashboardUser();
    if (!context) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
    return await saveProjectMutation(request, context.admin, false);
  } catch (error) {
    return projectMutationError(error);
  }
}
