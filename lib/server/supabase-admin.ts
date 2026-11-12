import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isAuthenticatedDashboardUser } from "@/lib/auth-utils";

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

export async function requireDashboardUser() {
  const sessionClient = await createSessionClient();
  const { data, error } = await sessionClient.auth.getUser();
  if (error || !isAuthenticatedDashboardUser(data.user)) return null;
  return { user: data.user, admin: createAdminClient() };
}

