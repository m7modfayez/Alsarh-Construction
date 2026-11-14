# Dashboard and project image operations

## Architecture

The dashboard and `/api/admin/*` routes require a valid Supabase Auth session. Admin API handlers verify the session on the server before creating a Service Role client. Public signup should remain disabled; every authenticated account can access the dashboard.

Project data and image records are stored in Supabase Database. Project images are uploaded on the server to Cloudinary; the resulting secure URLs and returned public IDs are saved with the ordered gallery records and the cover fields. Browser code does not upload to Cloudinary or write project records.

Image uploads accept JPEG, PNG, WebP, and AVIF input. Sharp validates the image contents, converts them to WebP, and Cloudinary stores them with unique IDs under `projects/{project UUID}/`. Retained images are not re-uploaded. Editing does not delete removed Cloudinary files. Deleting a project removes its Database records first, then attempts to delete unique Cloudinary assets that are no longer referenced.

## Required environment variables

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

The Service Role key and Cloudinary API key/secret must remain server-only.

## Database and legacy images

Migration 11, `202611110001_cloudinary_image_migration_journal.sql`, is historical; do not rewrite or remove it or its records.

The pending migration `202611120001_cloudinary_project_image_lifecycle.sql` has not been applied and still contains legacy cleanup and lifecycle SQL. Do not apply it as-is. It must be reviewed separately before applying schema changes. No migrations or production data were changed as part of the project image workflow.

Existing project URLs may still reference Supabase Storage. Keep their public read access and image host configuration until references are verified; new project image uploads and deletions do not use Supabase Storage.

## Verification

Automated local checks cover unit/static behavior only. Real Supabase and Cloudinary create/edit/delete workflows have not been run. Verify those flows with disposable credentials before staging or production use. Production migrations, deployments, and asset deletions have not been performed.
