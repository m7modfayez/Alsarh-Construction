import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync(new URL("../supabase-schema.sql", import.meta.url), "utf8");
const projectManagement = readFileSync(new URL("../lib/server/project-management.ts", import.meta.url), "utf8");
const adminRoute = readFileSync(new URL("../app/api/admin/projects/route.ts", import.meta.url), "utf8");

test("project image schema contains Cloudinary identity, ordering, and cascading project relation", () => {
  assert.match(schema, /cover_image_public_id TEXT/);
  assert.match(schema, /cloudinary_public_id TEXT/);
  assert.match(schema, /image_order INTEGER NOT NULL/);
  assert.match(schema, /project_id UUID REFERENCES projects\(id\) ON DELETE CASCADE/);
});

test("project create route retains server-side admin authorization", () => {
  assert.match(adminRoute, /requireDashboardAdmin\(\)/);
  assert.match(adminRoute, /if \(!context\.authorized\) return dashboardAdminDeniedResponse\(context\)/);
  assert.match(adminRoute, /saveProjectMutation\(request, context\.admin, false\)/);
});

test("project image operations use direct database writes, not lifecycle RPCs", () => {
  assert.match(projectManagement, /\.from\("projects"\)\s*\.insert/);
  assert.match(projectManagement, /\.from\("project_images"\)\.insert/);
  assert.doesNotMatch(projectManagement, /\.rpc\(/);
  assert.doesNotMatch(projectManagement, /cloudinary_asset_cleanup_jobs|reserve_asset_upload/);
});
