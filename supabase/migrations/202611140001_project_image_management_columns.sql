-- Add only the columns required by the direct project image management workflow.
-- Existing image URLs and records are retained; legacy provider/public IDs are not inferred.
-- Provider values remain NULL for legacy rows because their storage source is unknown.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS cover_image_public_id text,
  ADD COLUMN IF NOT EXISTS cover_image_provider text
    CONSTRAINT projects_cover_image_provider_check
    CHECK (cover_image_provider IN ('supabase', 'cloudinary')),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.project_images
  ADD COLUMN IF NOT EXISTS cloudinary_public_id text,
  ADD COLUMN IF NOT EXISTS image_provider text
    CONSTRAINT project_images_image_provider_check
    CHECK (image_provider IN ('supabase', 'cloudinary')),
  ADD COLUMN IF NOT EXISTS image_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Legacy created_at values are initialized together, so they cannot restore the
-- original gallery order. Use the image UUID as a deterministic fallback only.
WITH ordered_images AS (
  SELECT
    id,
    row_number() OVER (PARTITION BY project_id ORDER BY id) - 1 AS new_order
  FROM public.project_images
)
UPDATE public.project_images AS image
SET image_order = ordered_images.new_order::integer
FROM ordered_images
WHERE image.id = ordered_images.id;

CREATE OR REPLACE FUNCTION public.set_projects_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_projects_updated_at();
