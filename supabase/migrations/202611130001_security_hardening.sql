-- Run after 202611120001_cloudinary_project_image_lifecycle.sql.
-- Replace the exact production policies recorded in the security audit while
-- retaining the canonical public-read policies created by the lifecycle migration.
-- This migration does not access the image-migration run or journal tables.

DO $$
DECLARE
  expected record;
  actual record;
BEGIN
  -- Fail closed if any policy name captured in production has drifted to a
  -- different definition; do not drop a similarly named unrelated policy.
  FOR expected IN
    SELECT * FROM (VALUES
      ('public', 'projects', 'Allow all inserts', 'INSERT', NULL::text, 'true'::text),
      ('public', 'projects', 'Allow delete', 'DELETE', 'true'::text, NULL::text),
      ('public', 'projects', 'Allow select', 'SELECT', 'true'::text, NULL::text),
      ('public', 'projects', 'Allow update', 'UPDATE', 'true'::text, NULL::text),
      ('public', 'project_images', 'Allow all inserts', 'INSERT', NULL::text, 'true'::text),
      ('public', 'project_images', 'Allow delete', 'DELETE', 'true'::text, NULL::text),
      ('public', 'project_images', 'Allow select', 'SELECT', 'true'::text, NULL::text),
      ('public', 'project_images', 'Allow update', 'UPDATE', 'true'::text, NULL::text),
      ('storage', 'objects', 'delete 1iiiika_0', 'DELETE', '(bucket_id = ''projects''::text)', NULL::text),
      ('storage', 'objects', 'insert 1iiiika_0', 'INSERT', NULL::text, '(bucket_id = ''projects''::text)'),
      ('storage', 'objects', 'delete 1iiiika_1', 'SELECT', '(bucket_id = ''projects''::text)', NULL::text),
      ('storage', 'objects', 'select 1iiiika_0', 'SELECT', '(bucket_id = ''projects''::text)', NULL::text)
    ) AS policy_definitions(schemaname, tablename, policyname, cmd, qual, with_check)
  LOOP
    SELECT p.cmd, p.roles, p.qual, p.with_check, p.permissive
      INTO actual
      FROM pg_catalog.pg_policies AS p
     WHERE p.schemaname = expected.schemaname
       AND p.tablename = expected.tablename
       AND p.policyname = expected.policyname;

    IF FOUND AND (
      actual.cmd IS DISTINCT FROM expected.cmd OR
      actual.roles IS DISTINCT FROM ARRAY['public']::name[] OR
      actual.permissive IS DISTINCT FROM 'PERMISSIVE' OR
      actual.qual IS DISTINCT FROM expected.qual OR
      actual.with_check IS DISTINCT FROM expected.with_check
    ) THEN
      RAISE EXCEPTION 'Policy %.%.% no longer matches its audited production definition',
        expected.schemaname, expected.tablename, expected.policyname;
    END IF;
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'storage' AND c.relname = 'objects' AND c.relrowsecurity) THEN
    RAISE EXCEPTION 'storage.objects RLS must be enabled before bucket-scoped policy hardening';
  END IF;

  -- The lifecycle migration must have installed the public-read policies first.
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
     WHERE schemaname = 'public' AND tablename = 'projects'
       AND policyname = 'Public can read projects' AND cmd = 'SELECT'
       AND roles @> ARRAY['anon', 'authenticated']::name[] AND qual = 'true'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
     WHERE schemaname = 'public' AND tablename = 'project_images'
       AND policyname = 'Public can read project images' AND cmd = 'SELECT'
       AND roles @> ARRAY['anon', 'authenticated']::name[] AND qual = 'true'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
     WHERE schemaname = 'storage' AND tablename = 'objects'
       AND policyname = 'Public can read legacy project images' AND cmd = 'SELECT'
       AND roles @> ARRAY['anon', 'authenticated']::name[]
       AND qual = '(bucket_id = ''projects''::text)'
  ) THEN
    RAISE EXCEPTION 'Apply the lifecycle migration and verify its public-read policies before security hardening';
  END IF;
END;
$$;

-- Remove the actual public project/image policies captured in production.
-- The canonical public SELECT policies above remain in place.
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all inserts" ON public.projects;
DROP POLICY IF EXISTS "Allow delete" ON public.projects;
DROP POLICY IF EXISTS "Allow select" ON public.projects;
DROP POLICY IF EXISTS "Allow update" ON public.projects;
DROP POLICY IF EXISTS "Allow all inserts" ON public.project_images;
DROP POLICY IF EXISTS "Allow delete" ON public.project_images;
DROP POLICY IF EXISTS "Allow select" ON public.project_images;
DROP POLICY IF EXISTS "Allow update" ON public.project_images;

REVOKE INSERT, UPDATE, DELETE ON public.projects, public.project_images
  FROM PUBLIC, anon, authenticated;

-- Remove the exact project-bucket upload/delete policies and their redundant
-- public-read policies. Do not change grants or policies for other buckets.
DROP POLICY IF EXISTS "delete 1iiiika_0" ON storage.objects;
DROP POLICY IF EXISTS "insert 1iiiika_0" ON storage.objects;
DROP POLICY IF EXISTS "delete 1iiiika_1" ON storage.objects;
DROP POLICY IF EXISTS "select 1iiiika_0" ON storage.objects;

-- Restrictive, bucket-scoped guards ensure no permissive policy can re-enable
-- public writes to this bucket. For all other buckets the predicate is true,
-- so their existing policies and grants retain their behavior.
DROP POLICY IF EXISTS "Restrict public project bucket inserts" ON storage.objects;
DROP POLICY IF EXISTS "Restrict public project bucket updates" ON storage.objects;
DROP POLICY IF EXISTS "Restrict public project bucket deletes" ON storage.objects;
CREATE POLICY "Restrict public project bucket inserts" ON storage.objects
  AS RESTRICTIVE FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id <> 'projects');
CREATE POLICY "Restrict public project bucket updates" ON storage.objects
  AS RESTRICTIVE FOR UPDATE TO anon, authenticated
  USING (bucket_id <> 'projects') WITH CHECK (bucket_id <> 'projects');
CREATE POLICY "Restrict public project bucket deletes" ON storage.objects
  AS RESTRICTIVE FOR DELETE TO anon, authenticated
  USING (bucket_id <> 'projects');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
     WHERE schemaname = 'public' AND tablename IN ('projects', 'project_images')
       AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
       AND roles && ARRAY['public', 'anon', 'authenticated']::name[]
  ) THEN
    RAISE EXCEPTION 'Public project or project-image mutation policy remains enabled';
  END IF;

  IF NOT has_table_privilege('anon', 'public.projects', 'SELECT') OR
     NOT has_table_privilege('authenticated', 'public.projects', 'SELECT') OR
     NOT has_table_privilege('anon', 'public.project_images', 'SELECT') OR
     NOT has_table_privilege('authenticated', 'public.project_images', 'SELECT') THEN
    RAISE EXCEPTION 'Public project/image SELECT privileges must remain enabled';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
     WHERE schemaname = 'storage' AND tablename = 'objects'
       AND policyname = 'Public can read legacy project images' AND cmd = 'SELECT'
       AND roles @> ARRAY['anon', 'authenticated']::name[]
       AND qual = '(bucket_id = ''projects''::text)'
  ) THEN
    RAISE EXCEPTION 'Public reads for legacy project images must remain enabled';
  END IF;

  IF has_table_privilege('anon', 'storage.objects', 'INSERT') OR
     has_table_privilege('anon', 'storage.objects', 'UPDATE') OR
     has_table_privilege('anon', 'storage.objects', 'DELETE') OR
     has_table_privilege('authenticated', 'storage.objects', 'INSERT') OR
     has_table_privilege('authenticated', 'storage.objects', 'UPDATE') OR
     has_table_privilege('authenticated', 'storage.objects', 'DELETE') THEN
    -- Table grants are shared by every bucket. Keep them only where RLS is
    -- active and the restrictive projects-bucket guards below are installed.
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Restrict public project bucket inserts' AND permissive = 'RESTRICTIVE' AND cmd = 'INSERT') OR
       NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Restrict public project bucket updates' AND permissive = 'RESTRICTIVE' AND cmd = 'UPDATE') OR
       NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Restrict public project bucket deletes' AND permissive = 'RESTRICTIVE' AND cmd = 'DELETE') OR
       NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Restrict public project bucket inserts' AND with_check = '(bucket_id <> ''projects''::text)') OR
       NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Restrict public project bucket updates' AND qual = '(bucket_id <> ''projects''::text)'
      AND with_check = '(bucket_id <> ''projects''::text)') OR
       NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Restrict public project bucket deletes' AND qual = '(bucket_id <> ''projects''::text)') THEN
      RAISE EXCEPTION 'Storage table-level write grants require all restrictive project-bucket guards';
    END IF;
  END IF;
END;
$$;
