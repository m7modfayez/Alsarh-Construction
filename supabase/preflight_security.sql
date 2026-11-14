-- Read-only preflight for an authorized operator to run BEFORE reviewing or
-- applying migrations 202611120001 and 202611130001. This file has no DDL/DML.
SELECT current_database() AS database_name,
       current_user AS execution_role,
       now() AS observed_at;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies
WHERE (schemaname = 'public' AND tablename IN ('projects', 'project_images'))
   OR (schemaname = 'storage' AND tablename = 'objects')
ORDER BY schemaname, tablename, policyname;

SELECT n.nspname AS schema_name, c.relname AS table_name, c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE (n.nspname = 'public' AND c.relname IN ('projects', 'project_images', 'cloudinary_asset_cleanup_jobs', 'cloudinary_asset_upload_intents'))
   OR (n.nspname = 'storage' AND c.relname = 'objects')
ORDER BY n.nspname, c.relname;

SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE (table_schema = 'public' AND table_name IN ('projects', 'project_images', 'cloudinary_asset_cleanup_jobs', 'cloudinary_asset_upload_intents'))
   OR (table_schema = 'storage' AND table_name = 'objects')
ORDER BY table_schema, table_name, grantee, privilege_type;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('projects', 'project_images')
  AND column_name IN ('updated_at', 'cloudinary_public_id', 'image_provider', 'image_order', 'cover_image_public_id')
ORDER BY table_name, ordinal_position;

SELECT tg.tgname AS trigger_name, c.relname AS table_name, pg_get_triggerdef(tg.oid, true) AS definition
FROM pg_catalog.pg_trigger tg
JOIN pg_catalog.pg_class c ON c.oid = tg.tgrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE NOT tg.tgisinternal AND n.nspname = 'public' AND c.relname IN ('projects', 'project_images')
ORDER BY c.relname, tg.tgname;

SELECT version, name, statements, created_by, idempotent
FROM supabase_migrations.schema_migrations
WHERE version IN ('202611110001', '202611120001', '202611130001')
ORDER BY version;
