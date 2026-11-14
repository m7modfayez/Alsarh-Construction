import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDashboardAuthorization } from "@/lib/auth-utils";

function required(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable ${name}`);
  return value;
}

export async function createSessionClient() {
  const cookieStore = await cookies();
  return createServerClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Route handlers can refresh cookies; Server Components cannot.
          }
        },
      },
    },
  );
}

let adminClient: SupabaseClient | undefined;

export function createAdminClient(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(
      required("NEXT_PUBLIC_SUPABASE_URL"),
      required("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
    );
  }
  return adminClient;
}

export type DashboardAdminContext = {
  authorized: true;
  user: { id: string };
  admin: SupabaseClient;
};

export type DashboardAdminIdentityAccess = {
  authorized: true;
  user: { id: string };
} | {
  authorized: false;
  status: 401;
};

export type DashboardAdminAccess = DashboardAdminContext | Extract<DashboardAdminIdentityAccess, { authorized: false }>;

export async function requireDashboardAdminIdentity(): Promise<DashboardAdminIdentityAccess> {
  const sessionClient = await createSessionClient();
  const { data, error } = await sessionClient.auth.getUser();
  const authorization = getDashboardAuthorization(error ? null : data.user);
  if (authorization !== "authorized") {
    return { authorized: false, status: 401 };
  }
  return { authorized: true, user: data.user! };
}

export async function requireDashboardAdmin(): Promise<DashboardAdminAccess> {
  const identity = await requireDashboardAdminIdentity();
  if (!identity.authorized) return identity;
  return { ...identity, admin: createAdminClient() };
}

export function dashboardAdminDeniedResponse(access: Extract<DashboardAdminAccess, { authorized: false }>) {
  return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: access.status });
}

