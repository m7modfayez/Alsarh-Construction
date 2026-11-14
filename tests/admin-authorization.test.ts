import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { getDashboardAuthorization } from "../lib/auth-utils";

const EXISTING_USER_ID = "123e4567-e89b-42d3-a456-426614174000";
const NEW_USER_ID = "123e4567-e89b-42d3-a456-426614174001";
const root = process.cwd();

test("authenticated Supabase users can access dashboard operations", () => {
  assert.equal(getDashboardAuthorization(null), "unauthenticated");
  assert.equal(getDashboardAuthorization({}), "unauthenticated");
  assert.equal(getDashboardAuthorization({ id: " " }), "unauthenticated");
  assert.equal(getDashboardAuthorization({ id: EXISTING_USER_ID }), "authorized");
  // A newly created account is equally authorized once Supabase verifies its session.
  assert.equal(getDashboardAuthorization({ id: NEW_USER_ID }), "authorized");
});

test("dashboard layout redirects unauthenticated users and renders for authenticated users", () => {
  assert.equal(getDashboardAuthorization(null), "unauthenticated");
  assert.equal(getDashboardAuthorization({ id: NEW_USER_ID }), "authorized");

  const layout = readFileSync(join(root, "app/dashboard/layout.tsx"), "utf8");
  assert.match(layout, /requireDashboardAdminIdentity\(\)/);
  assert.match(layout, /if \(!access\.authorized\) redirect\("\/login"\)/);
  assert.match(layout, /return <DashboardShell>\{children\}<\/DashboardShell>/);
  assert.doesNotMatch(layout, /notFound\(/);
});

test("every admin API handler authenticates and authorizes before its operation", () => {
  const routes = [
    ["app/api/admin/projects/route.ts", ["POST"]],
    ["app/api/admin/projects/[id]/route.ts", ["PUT", "DELETE"]],
  ] as const;

  for (const [relativePath, methods] of routes) {
    const source = readFileSync(join(root, relativePath), "utf8");
    assert.match(source, /requireDashboardAdmin/);
    assert.match(source, /dashboardAdminDeniedResponse/);
    for (const method of methods) {
      const handler = source.match(new RegExp(`export async function ${method}\\b[\\s\\S]*?(?=\\nexport async function |$)`));
      assert.ok(handler, `${relativePath} must export ${method}`);
      assert.match(handler[0], /requireDashboardAdmin\(\)/, `${relativePath} ${method} must authenticate`);
      assert.match(handler[0], /if \(!context\.authorized\) return dashboardAdminDeniedResponse\(context\)/, `${relativePath} ${method} must deny non-admins`);
    }
  }

  const guard = readFileSync(join(root, "lib/server/supabase-admin.ts"), "utf8");
  const getUserPosition = guard.indexOf("sessionClient.auth.getUser()");
  const serviceRoleClientPosition = guard.indexOf("createAdminClient()", guard.indexOf("export async function requireDashboardAdmin()"));
  assert.ok(getUserPosition >= 0, "shared guard must verify the user with Supabase auth.getUser()");
  assert.ok(serviceRoleClientPosition > getUserPosition, "Service Role client must be created only after user verification");
});

test("public read policies and grants remain for projects, galleries, and legacy images", () => {
  const lifecycle = readFileSync(join(root, "supabase/migrations/202611120001_cloudinary_project_image_lifecycle.sql"), "utf8");
  const hardening = readFileSync(join(root, "supabase/migrations/202611130001_security_hardening.sql"), "utf8");

  assert.match(lifecycle, /CREATE POLICY "Public can read projects"[\s\S]*?FOR SELECT TO anon, authenticated USING \(true\)/);
  assert.match(lifecycle, /CREATE POLICY "Public can read project images"[\s\S]*?FOR SELECT TO anon, authenticated USING \(true\)/);
  assert.match(lifecycle, /CREATE POLICY "Public can read legacy project images"[\s\S]*?FOR SELECT TO anon, authenticated USING \(bucket_id = 'projects'\)/);
  assert.match(lifecycle, /GRANT SELECT ON public\.projects, public\.project_images TO anon, authenticated/);
  assert.match(hardening, /Public can read projects/);
  assert.match(hardening, /Public can read project images/);
  assert.match(hardening, /Public can read legacy project images/);
  assert.doesNotMatch(hardening, /REVOKE\s+SELECT/i);
  assert.match(hardening, /actual\.permissive IS DISTINCT FROM 'PERMISSIVE'/);
  assert.match(hardening, /storage\.objects RLS must be enabled/);
  assert.match(hardening, /Restrict public project bucket inserts/);
  assert.match(hardening, /has_table_privilege\('anon', 'storage\.objects', 'INSERT'\)/);
});

test("security migration targets audited project policies and scopes storage write guards", () => {
  const sql = readFileSync(join(root, "supabase/migrations/202611130001_security_hardening.sql"), "utf8");
  for (const policy of [
    '"Allow all inserts"', '"Allow delete"', '"Allow select"', '"Allow update"',
    '"delete 1iiiika_0"', '"insert 1iiiika_0"', '"delete 1iiiika_1"', '"select 1iiiika_0"',
  ]) assert.ok(sql.includes(policy), `missing audited policy ${policy}`);
  assert.match(sql, /REVOKE INSERT, UPDATE, DELETE ON public\.projects, public\.project_images/);
  assert.match(sql, /AS RESTRICTIVE FOR INSERT TO anon, authenticated[\s\S]*?WITH CHECK \(bucket_id <> 'projects'\)/);
  assert.match(sql, /AS RESTRICTIVE FOR DELETE TO anon, authenticated[\s\S]*?USING \(bucket_id <> 'projects'\)/);
  assert.doesNotMatch(sql, /\b(?:DROP|TRUNCATE|DELETE FROM)\s+storage\.objects\b/i);
  assert.doesNotMatch(sql, /\b(?:DROP|TRUNCATE|DELETE FROM)\s+public\.cloudinary_image_migration_(?:runs|journal)\b/i);
});
