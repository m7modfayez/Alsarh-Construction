import { NextResponse } from "next/server";
import { requireDashboardUser } from "@/lib/server/supabase-admin";
import { cloudinaryCleanupStatus, projectMutationError, retryCloudinaryCleanup } from "@/lib/server/project-management";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context = await requireDashboardUser();
    if (!context) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
    return await cloudinaryCleanupStatus(context.admin);
  } catch (error) {
    return projectMutationError(error);
  }
}

export async function POST() {
  try {
    const context = await requireDashboardUser();
    if (!context) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
    return await retryCloudinaryCleanup(context.admin);
  } catch (error) {
    return projectMutationError(error);
  }
}
