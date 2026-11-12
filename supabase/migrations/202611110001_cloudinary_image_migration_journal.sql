-- Prepared migration only. Review and apply separately to the intended Supabase project.
-- Database rows and their durable migration journal are changed in the same RPC transaction.

CREATE TABLE IF NOT EXISTS public.cloudinary_image_migration_runs (
  migration_id uuid PRIMARY KEY,
  manifest_checksum text NOT NULL CHECK (manifest_checksum ~ '^[a-f0-9]{64}$'),
  manifest_entries jsonb NOT NULL CHECK (jsonb_typeof(manifest_entries) = 'array'),
  registered_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cloudinary_image_migration_journal (
  migration_id uuid NOT NULL,
  manifest_checksum text NOT NULL CHECK (manifest_checksum ~ '^[a-f0-9]{64}$'),
  table_name text NOT NULL CHECK (table_name IN ('project_images', 'projects')),
  primary_key_column text NOT NULL CHECK (primary_key_column = 'id'),
  row_id uuid NOT NULL,
  url_column text NOT NULL CHECK (
    (table_name = 'project_images' AND url_column = 'image_url') OR
    (table_name = 'projects' AND url_column = 'cover_image')
  ),
  expected_original_url text NOT NULL,
  expected_cloudinary_url text NOT NULL,
  original_path text NOT NULL,
  cloudinary_public_id text NOT NULL,
  source_sha256 text,
  optimized_sha256 text,
  mapping_verification_status text NOT NULL,
  action text NOT NULL CHECK (action IN ('apply', 'exclude')),
  apply_status text NOT NULL CHECK (apply_status IN ('pending', 'applied', 'conflict', 'failed', 'needs_reconciliation', 'excluded')),
  rollback_status text NOT NULL CHECK (rollback_status IN ('pending', 'rolled_back', 'conflict', 'failed', 'needs_reconciliation', 'not_applicable')),
  applied_at timestamptz,
  rolled_back_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  apply_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  rollback_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (migration_id, table_name, row_id),
  CHECK (action = 'exclude' OR source_sha256 ~ '^[a-f0-9]{64}$'),
  CHECK (action = 'exclude' OR optimized_sha256 ~ '^[a-f0-9]{64}$')
);

ALTER TABLE public.cloudinary_image_migration_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloudinary_image_migration_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cloudinary_image_migration_journal FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON public.cloudinary_image_migration_runs FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cloudinary_image_migration_register_manifest(
  p_migration_id uuid,
  p_manifest_checksum text,
  p_entries jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  e jsonb;
  v_table text;
  v_pk text;
  v_row uuid;
  v_column text;
  v_action text;
  v_path text;
  v_status text;
  v_rollback text;
  v_existing public.cloudinary_image_migration_journal%ROWTYPE;
  v_run public.cloudinary_image_migration_runs%ROWTYPE;
  v_total integer := 0;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role is required';
  END IF;
  IF p_manifest_checksum !~ '^[a-f0-9]{64}$' OR jsonb_typeof(p_entries) <> 'array' THEN
    RAISE EXCEPTION 'invalid manifest registration arguments';
  END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(p_entries)) <>
     (SELECT count(DISTINCT (value->>'tableName') || ':' || (value->>'rowId')) FROM jsonb_array_elements(p_entries)) THEN
    RAISE EXCEPTION 'manifest contains duplicate table/row identities';
  END IF;
  INSERT INTO public.cloudinary_image_migration_runs (migration_id, manifest_checksum, manifest_entries)
  VALUES (p_migration_id, p_manifest_checksum, p_entries)
  ON CONFLICT (migration_id) DO NOTHING;
  SELECT * INTO v_run FROM public.cloudinary_image_migration_runs
  WHERE migration_id = p_migration_id FOR UPDATE;
  IF v_run.manifest_checksum <> p_manifest_checksum OR v_run.manifest_entries <> p_entries THEN
    RAISE EXCEPTION 'migration ID is already bound to a different immutable manifest';
  END IF;

  FOR e IN SELECT value FROM jsonb_array_elements(p_entries)
  LOOP
    IF e->>'migrationId' IS DISTINCT FROM p_migration_id::text THEN
      RAISE EXCEPTION 'manifest entry migration ID does not match registration';
    END IF;
    v_table := e->>'tableName';
    v_pk := e->>'primaryKeyColumn';
    v_row := (e->>'rowId')::uuid;
    v_column := e->>'urlColumn';
    v_action := e->>'action';
    v_path := e->>'originalPath';
    IF v_pk <> 'id' OR NOT (
      (v_table = 'project_images' AND v_column = 'image_url') OR
      (v_table = 'projects' AND v_column = 'cover_image')
    ) THEN
      RAISE EXCEPTION 'unsupported target in migration manifest';
    END IF;
    IF (v_action = 'exclude' AND v_path <> '1776998926472-kfpkv2m60la-1000010328.jpg') OR
       (v_action = 'apply' AND v_path = '1776998926472-kfpkv2m60la-1000010328.jpg') OR
       v_action NOT IN ('apply', 'exclude') THEN
      RAISE EXCEPTION 'manifest exclusion policy violation';
    END IF;
    IF v_action = 'apply' AND (
      e->>'mappingVerificationStatus' <> 'verified' OR
      coalesce(e->>'expectedOriginalUrl', '') = '' OR
      coalesce(e->>'expectedCloudinarySecureUrl', '') = '' OR
      coalesce(e->>'cloudinaryPublicId', '') = '' OR
      coalesce(e->>'expectedSourceSha256', '') !~ '^[a-f0-9]{64}$' OR
      coalesce(e->>'expectedOptimizedSha256', '') !~ '^[a-f0-9]{64}$'
    ) THEN
      RAISE EXCEPTION 'unverified or incomplete apply entry in manifest';
    END IF;

    v_status := CASE WHEN v_action = 'exclude' THEN 'excluded' ELSE 'pending' END;
    v_rollback := CASE WHEN v_action = 'exclude' THEN 'not_applicable' ELSE 'pending' END;
    INSERT INTO public.cloudinary_image_migration_journal (
      migration_id, manifest_checksum, table_name, primary_key_column, row_id, url_column,
      expected_original_url, expected_cloudinary_url, original_path, cloudinary_public_id,
      source_sha256, optimized_sha256, mapping_verification_status, action, apply_status, rollback_status
    ) VALUES (
      p_migration_id, p_manifest_checksum, v_table, v_pk, v_row, v_column,
      e->>'expectedOriginalUrl', e->>'expectedCloudinarySecureUrl', v_path, e->>'cloudinaryPublicId',
      e->>'expectedSourceSha256', e->>'expectedOptimizedSha256', e->>'mappingVerificationStatus',
      v_action, v_status, v_rollback
    ) ON CONFLICT (migration_id, table_name, row_id) DO NOTHING;

    SELECT * INTO v_existing FROM public.cloudinary_image_migration_journal
    WHERE migration_id = p_migration_id AND table_name = v_table AND row_id = v_row;
    IF v_existing.manifest_checksum <> p_manifest_checksum OR
       v_existing.url_column <> v_column OR
       v_existing.expected_original_url IS DISTINCT FROM e->>'expectedOriginalUrl' OR
       v_existing.expected_cloudinary_url IS DISTINCT FROM e->>'expectedCloudinarySecureUrl' OR
       v_existing.original_path IS DISTINCT FROM v_path OR
       v_existing.cloudinary_public_id IS DISTINCT FROM e->>'cloudinaryPublicId' OR
       v_existing.source_sha256 IS DISTINCT FROM e->>'expectedSourceSha256' OR
       v_existing.optimized_sha256 IS DISTINCT FROM e->>'expectedOptimizedSha256' OR
       v_existing.mapping_verification_status IS DISTINCT FROM e->>'mappingVerificationStatus' OR
       v_existing.action IS DISTINCT FROM v_action THEN
      RAISE EXCEPTION 'registered journal entry conflicts with immutable manifest';
    END IF;
    v_total := v_total + 1;
  END LOOP;

  RETURN jsonb_build_object('migrationId', p_migration_id, 'checksum', p_manifest_checksum, 'registeredEntries', v_total);
END;
$$;

CREATE OR REPLACE FUNCTION public.cloudinary_image_migration_apply_row(
  p_migration_id uuid,
  p_manifest_checksum text,
  p_table_name text,
  p_row_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  j public.cloudinary_image_migration_journal%ROWTYPE;
  v_current_url text;
  v_updated_id uuid;
  v_rows integer;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service_role is required'; END IF;
  SELECT * INTO j FROM public.cloudinary_image_migration_journal
  WHERE migration_id = p_migration_id AND table_name = p_table_name AND row_id = p_row_id
  FOR UPDATE;
  IF NOT FOUND OR j.manifest_checksum <> p_manifest_checksum THEN RAISE EXCEPTION 'manifest journal entry missing or checksum mismatch'; END IF;
  IF j.action = 'exclude' THEN RETURN jsonb_build_object('status', 'excluded'); END IF;

  EXECUTE format('SELECT %I FROM public.%I WHERE id = $1 FOR UPDATE', j.url_column, j.table_name)
    INTO v_current_url USING j.row_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    UPDATE public.cloudinary_image_migration_journal SET apply_status = 'conflict', updated_at = now(),
      apply_result = jsonb_build_object('stage', 'apply', 'reason', 'row_missing')
    WHERE migration_id = p_migration_id AND table_name = p_table_name AND row_id = p_row_id;
    RETURN jsonb_build_object('status', 'conflict', 'reason', 'row_missing');
  END IF;

  IF j.applied_at IS NOT NULL AND v_current_url = j.expected_cloudinary_url THEN
    RETURN jsonb_build_object('status', 'applied', 'rowId', j.row_id, 'idempotent', true);
  ELSIF j.applied_at IS NOT NULL THEN
    UPDATE public.cloudinary_image_migration_journal SET apply_status = 'needs_reconciliation', updated_at = now(),
      apply_result = jsonb_build_object('stage', 'apply', 'reason', 'row_changed_after_apply')
    WHERE migration_id = p_migration_id AND table_name = p_table_name AND row_id = p_row_id;
    RETURN jsonb_build_object('status', 'needs_reconciliation', 'reason', 'row_changed_after_apply');
  END IF;

  IF j.apply_status NOT IN ('pending', 'failed') THEN
    RETURN jsonb_build_object('status', j.apply_status, 'reason', 'journal_state_not_retryable');
  END IF;
  IF v_current_url IS DISTINCT FROM j.expected_original_url THEN
    UPDATE public.cloudinary_image_migration_journal SET apply_status = 'conflict', updated_at = now(),
      apply_result = jsonb_build_object('stage', 'apply', 'reason', 'current_url_does_not_match_manifest')
    WHERE migration_id = p_migration_id AND table_name = p_table_name AND row_id = p_row_id;
    RETURN jsonb_build_object('status', 'conflict', 'reason', 'current_url_does_not_match_manifest');
  END IF;

  EXECUTE format('UPDATE public.%I SET %I = $1 WHERE id = $2 AND %I = $3 RETURNING id', j.table_name, j.url_column, j.url_column)
    INTO v_updated_id USING j.expected_cloudinary_url, j.row_id, j.expected_original_url;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 OR v_updated_id IS DISTINCT FROM j.row_id THEN
    UPDATE public.cloudinary_image_migration_journal SET apply_status = 'conflict', updated_at = now(),
      apply_result = jsonb_build_object('stage', 'apply', 'reason', 'conditional_update_count', 'rowCount', v_rows)
    WHERE migration_id = p_migration_id AND table_name = p_table_name AND row_id = p_row_id;
    RETURN jsonb_build_object('status', 'conflict', 'reason', 'conditional_update_count', 'rowCount', v_rows);
  END IF;
  UPDATE public.cloudinary_image_migration_journal SET apply_status = 'applied', applied_at = now(), updated_at = now(),
    apply_result = jsonb_build_object('stage', 'apply', 'rowId', j.row_id)
  WHERE migration_id = p_migration_id AND table_name = p_table_name AND row_id = p_row_id;
  RETURN jsonb_build_object('status', 'applied', 'rowId', j.row_id, 'idempotent', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.cloudinary_image_migration_mark_failed(
  p_migration_id uuid,
  p_manifest_checksum text,
  p_table_name text,
  p_row_id uuid,
  p_message text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  j public.cloudinary_image_migration_journal%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service_role is required'; END IF;
  SELECT * INTO j FROM public.cloudinary_image_migration_journal
  WHERE migration_id = p_migration_id AND table_name = p_table_name AND row_id = p_row_id FOR UPDATE;
  IF NOT FOUND OR j.manifest_checksum <> p_manifest_checksum THEN RAISE EXCEPTION 'manifest journal entry missing or checksum mismatch'; END IF;
  IF j.applied_at IS NULL AND j.apply_status IN ('pending', 'failed') THEN
    UPDATE public.cloudinary_image_migration_journal SET apply_status = 'failed', updated_at = now(),
      apply_result = jsonb_build_object('stage', 'pre_apply_validation', 'message', left(p_message, 2000))
    WHERE migration_id = p_migration_id AND table_name = p_table_name AND row_id = p_row_id;
  END IF;
  RETURN jsonb_build_object('status', j.apply_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.cloudinary_image_migration_rollback_row(
  p_migration_id uuid,
  p_manifest_checksum text,
  p_table_name text,
  p_row_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  j public.cloudinary_image_migration_journal%ROWTYPE;
  v_current_url text;
  v_updated_id uuid;
  v_rows integer;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service_role is required'; END IF;
  SELECT * INTO j FROM public.cloudinary_image_migration_journal
  WHERE migration_id = p_migration_id AND table_name = p_table_name AND row_id = p_row_id
  FOR UPDATE;
  IF NOT FOUND OR j.manifest_checksum <> p_manifest_checksum THEN RAISE EXCEPTION 'manifest journal entry missing or checksum mismatch'; END IF;
  IF j.action = 'exclude' OR j.applied_at IS NULL THEN RETURN jsonb_build_object('status', 'not_applied'); END IF;
  IF j.rolled_back_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'rolled_back', 'idempotent', true); END IF;

  EXECUTE format('SELECT %I FROM public.%I WHERE id = $1 FOR UPDATE', j.url_column, j.table_name)
    INTO v_current_url USING j.row_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 OR v_current_url IS DISTINCT FROM j.expected_cloudinary_url THEN
    UPDATE public.cloudinary_image_migration_journal SET rollback_status = 'conflict', updated_at = now(),
      rollback_result = jsonb_build_object('stage', 'rollback', 'reason', CASE WHEN v_rows = 0 THEN 'row_missing' ELSE 'current_url_does_not_match_cloudinary_url' END)
    WHERE migration_id = p_migration_id AND table_name = p_table_name AND row_id = p_row_id;
    RETURN jsonb_build_object('status', 'conflict');
  END IF;

  EXECUTE format('UPDATE public.%I SET %I = $1 WHERE id = $2 AND %I = $3 RETURNING id', j.table_name, j.url_column, j.url_column)
    INTO v_updated_id USING j.expected_original_url, j.row_id, j.expected_cloudinary_url;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 OR v_updated_id IS DISTINCT FROM j.row_id THEN
    UPDATE public.cloudinary_image_migration_journal SET rollback_status = 'conflict', updated_at = now(),
      rollback_result = jsonb_build_object('stage', 'rollback', 'reason', 'conditional_update_count', 'rowCount', v_rows)
    WHERE migration_id = p_migration_id AND table_name = p_table_name AND row_id = p_row_id;
    RETURN jsonb_build_object('status', 'conflict');
  END IF;
  UPDATE public.cloudinary_image_migration_journal SET rollback_status = 'rolled_back', rolled_back_at = now(), updated_at = now(),
    rollback_result = jsonb_build_object('stage', 'rollback', 'rowId', j.row_id)
  WHERE migration_id = p_migration_id AND table_name = p_table_name AND row_id = p_row_id;
  RETURN jsonb_build_object('status', 'rolled_back', 'rowId', j.row_id, 'idempotent', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.cloudinary_image_migration_get_row(
  p_migration_id uuid,
  p_manifest_checksum text,
  p_table_name text,
  p_row_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  j public.cloudinary_image_migration_journal%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service_role is required'; END IF;
  SELECT * INTO j FROM public.cloudinary_image_migration_journal
  WHERE migration_id = p_migration_id AND table_name = p_table_name AND row_id = p_row_id;
  IF NOT FOUND OR j.manifest_checksum <> p_manifest_checksum THEN RAISE EXCEPTION 'manifest journal entry missing or checksum mismatch'; END IF;
  RETURN jsonb_build_object(
    'migrationId', j.migration_id, 'tableName', j.table_name, 'rowId', j.row_id,
    'applyStatus', j.apply_status, 'rollbackStatus', j.rollback_status,
    'appliedAt', j.applied_at, 'rolledBackAt', j.rolled_back_at, 'applyResult', j.apply_result, 'rollbackResult', j.rollback_result
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cloudinary_image_migration_register_manifest(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cloudinary_image_migration_apply_row(uuid, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cloudinary_image_migration_mark_failed(uuid, text, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cloudinary_image_migration_rollback_row(uuid, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cloudinary_image_migration_get_row(uuid, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cloudinary_image_migration_register_manifest(uuid, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.cloudinary_image_migration_apply_row(uuid, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.cloudinary_image_migration_mark_failed(uuid, text, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cloudinary_image_migration_rollback_row(uuid, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.cloudinary_image_migration_get_row(uuid, text, text, uuid) TO service_role;
