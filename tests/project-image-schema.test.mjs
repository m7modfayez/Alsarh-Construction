import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync(new URL("../supabase/migrations/202611120001_cloudinary_project_image_lifecycle.sql", import.meta.url), "utf8");

test("schema migration stores Cloudinary identity, provider, and ordering metadata", () => {
  assert.match(sql, /ADD COLUMN IF NOT EXISTS cloudinary_public_id text/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS image_order integer/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS cover_image_public_id text/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS cover_image_provider text/);
});

test("project mutations are transactional RPCs restricted to service_role", () => {
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.cloudinary_save_project/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.cloudinary_delete_project/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.cloudinary_save_project\(uuid, timestamptz, jsonb, jsonb\) TO service_role/);
  assert.match(sql, /REVOKE INSERT, UPDATE, DELETE ON public\.projects FROM PUBLIC, anon, authenticated/);
});

test("durable cleanup checks references and blocks attachments while deletion is processing", () => {
  assert.match(sql, /cloudinary_public_id = p_cloudinary_public_id\)\s+OR EXISTS/);
  assert.match(sql, /cloudinary_asset_cleanup_jobs\.status IN \('pending', 'failed', 'deleted', 'cancelled'\)/);
  assert.match(sql, /v_job_status = 'processing'/);
  assert.match(sql, /FOR UPDATE SKIP LOCKED/);
});

test("the excluded legacy image is not included in mapping backfill", () => {
  assert.doesNotMatch(sql, /1776998926472-kfpkv2m60la-1000010328\.jpg/);
  assert.match(sql, /image_provider = 'cloudinary'/);
});
