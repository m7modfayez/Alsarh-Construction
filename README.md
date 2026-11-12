# الصرح - Alsarh

A modern construction company website built with Next.js, featuring project portfolios, service offerings, and contact management.

## 🎯 About

الصرح is a professional construction and architectural firm website showcasing innovative building solutions and sustainable construction services for modern projects.

## 🚀 Features

- **Responsive Design**: Optimized for mobile, tablet, and desktop views
- **Project Portfolio**: Showcase of completed and ongoing projects
- **Service Listing**: Detailed service offerings and capabilities
- **Contact Management**: Integrated contact forms and location information
- **Multi-section Layout**: Home, Projects, About, Services, Team, and Contact sections
- **Google Maps Integration**: Easy access to business location
- **Professional UI**: Modern, clean design with Tailwind CSS

## 🛠 Tech Stack

- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI
- **Icons**: Lucide React
- **Package Manager**: pnpm
- **Font**: Geist (Google Fonts)

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Alsarh
```

2. Install dependencies:
```bash
pnpm install
```

## 🚀 Getting Started

### Development Server

Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Build

Build for production:
```bash
pnpm build
```

### Production Server

Start the production server:
```bash
pnpm start
```

## 📂 Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── projects/          # Projects section
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Navbar.tsx         # Navigation bar
│   ├── Hero.tsx           # Hero section
│   ├── Footer.tsx         # Footer
│   └── ui/                # UI component library
├── lib/                   # Utilities and helpers
│   ├── ar-content.ts      # Arabic content constants
│   └── utils.ts           # Utility functions
├── public/                # Static assets
│   └── images/            # Image files
├── data/                  # Data files
│   ├── projects.ts        # Project data
│   ├── services.ts        # Service data
│   └── team.ts            # Team data
└── types/                 # TypeScript type definitions
```

## 🎨 Customization

### Content

All Arabic content is managed in [lib/ar-content.ts](lib/ar-content.ts). Update text, navigation labels, and descriptions there.

### Styling

- Color scheme: Primary color `#6B1820` (maroon)
- Tailwind CSS configuration in [tailwind.config.js](tailwind.config.js)
- Global styles in [app/globals.css](app/globals.css)

### Images

Place images in the `public/images/` directory. Currently using:
- `alsarh1.png` - Logo and hero background
- `alsarh2.png` - Alternative project images

## 📝 License

Private project. All rights reserved © 2026 الصرح

## One-time project image migration

The standalone `scripts/migrate-project-images.ts` tool copies images from the public Supabase `projects` bucket to Cloudinary. It does not change the website's upload logic or delete/modify source files. It lists bucket folders recursively with pagination, converts static JPEG/PNG images to WebP with Sharp (auto orientation, maximum 2000 × 2000, quality 80, no upscaling), and preserves PNG alpha. GIF and other unsupported formats are explicitly skipped; animated PNGs are detected and skipped instead of being flattened. Cloudinary uploads have overwrite disabled. The deterministic public ID includes the source path and downloaded-content SHA-256; changed source bytes receive a different ID, while earlier mapping entries remain available for rollback.

The database step uses a fixed row manifest and a PostgreSQL journal. The checked-in `supabase-schema.sql` confirms that both target tables have UUID `id` primary keys; it also defines an `updated_at` trigger on `projects`, so updating `cover_image` invokes that existing timestamp trigger. `db:preview` reads both target tables and writes `apply-manifest.json` locally with one entry per exact row, an explicit excluded row for `1776998926472-kfpkv2m60la-1000010328.jpg`, a creation time, and a SHA-256 checksum. Preview refuses to replace an existing manifest and errors if a later live preview differs. Review the manifest contents and checksum before authorizing apply.

Before any database apply, an administrator must review and separately apply `supabase/migrations/202611110001_cloudinary_image_migration_journal.sql` to the intended Supabase project. This prepared SQL adds a private migration-run registry and per-row journal, plus service-role-only RPCs. Registration binds the migration ID to the exact manifest JSON and checksum. Apply RPCs lock the specified row, check its URL still equals the manifest source, conditionally update only that row, and record the result in the same transaction. Rollback RPCs use only journal entries with a successful apply timestamp and restore only when the row still contains the expected Cloudinary URL. The script does not execute this schema migration.

Apply requires the exact checksum printed by preview. Mapping hashes, URLs, IDs, status, and checksum are revalidated; each Cloudinary delivery is fetched and checked against its optimized SHA-256 immediately before the row RPC. If a row changed after preview, it is recorded as a conflict and left untouched. Re-running apply with the same manifest is safe: committed rows are recognized from the database journal, pending/failed rows are retried conditionally, and unknown RPC outcomes are reconciled from durable journal state. No rows outside the manifest are sent to the RPCs. The exact excluded path is recorded in the manifest and is never sent to apply or rollback.

### Environment

Set these in `.env.local` (or the process environment used to run the CLI). Keep the service-role key and Cloudinary credentials server-side; do not add `NEXT_PUBLIC_` prefixes to those secrets:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
# Required only for manifest registration, database apply, and rollback RPCs. Local CLI only.
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

The CLI uses the repository's existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` names. The publishable key can read the public bucket and database preview according to project RLS policies. Database apply and rollback require `SUPABASE_SERVICE_ROLE_KEY` for the restricted RPC functions. Never put the service-role key or Cloudinary API secret in a `NEXT_PUBLIC_` variable or client-side code. Secrets are not printed.

### Install and run

Install dependencies with the repository package manager:

```bash
pnpm install
```

Run the focused migration tests:

```bash
pnpm test:migration
```

Run a five-image sample first, then inspect `migration-data/cloudinary-project-images/report.json` and `mapping.json`. `--limit=5` selects exactly the first five supported JPEG/PNG objects by stable path order and stops with an error if fewer than five exist; unsupported storage objects do not count toward five:

```bash
pnpm images:migrate upload --limit=5
pnpm images:migrate verify
```

To select by original size instead, run `pnpm images:migrate upload --largest=5`. This selects exactly the five largest supported JPEG/PNG objects, sorted by original byte size descending and object path ascending for ties. Storage listing size metadata is used when available; otherwise supported images are downloaded to determine their byte sizes before selection. `--largest` and `--limit` are mutually exclusive. The report records the selection mode and selected paths/sizes; successful entries include original size, optimized size, and compression percentage.

Upload all listed objects (already completed items are reused):

```bash
pnpm images:migrate upload
pnpm images:migrate verify
```

Create or recheck the exact row manifest with the read-only preview. Review `apply-manifest.json` and copy its checksum. The prepared PostgreSQL migration must be applied separately by an administrator before database apply can work:

```bash
pnpm images:migrate db:preview
pnpm images:migrate db:apply --confirm --manifest-checksum=<sha256-from-preview>
```

If a rollback is needed, use the same migration manifest checksum. Rollback reads the database journal and touches only rows recorded as successfully changed:

```bash
pnpm images:migrate db:rollback --confirm --manifest-checksum=<sha256-from-preview>
```

Local progress, the immutable preview manifest, and reports are written under `migration-data/cloudinary-project-images/` and ignored by Git. Keep this directory secure and backed up. The database journal is authoritative for apply/rollback results; the local manifest is the fixed row set and mapping identity approved by checksum.

### Website checks after database update

After `db:apply`, run `pnpm dev` and check the home page project section and project detail/list pages, including cover images and galleries. Check images at desktop and mobile widths, and review the browser console/network panel for failed Cloudinary requests. Open several migrated URLs directly, including a transparent PNG if present. The one intentionally excluded legacy image remains on Supabase Storage with its original URL. New dashboard uploads use the separate server-side Cloudinary lifecycle documented below.

## Admin project image lifecycle

New project images are uploaded only by authenticated Node.js route handlers at `/api/admin/projects`; the browser stages files locally and never receives Cloudinary credentials. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the server environment. Keep the Cloudinary API secret and Supabase service-role key out of all `NEXT_PUBLIC_` variables. The route first validates each JPEG, PNG, or WebP (10 MiB per file, 30 MiB per request, 20 images maximum), corrects EXIF orientation with Sharp, resizes without upscaling to at most 2000 × 2000, and encodes WebP at quality 80.

The route derives an ID from the project UUID and SHA-256 of the original file, uploads with overwrite disabled, validates the Cloudinary response and delivery bytes, and then calls a transactional Supabase RPC to persist project metadata, ordered image rows, and cover metadata. A request retry with the same project ID and file bytes can reuse that exact verified Cloudinary asset. Editing sends existing image row IDs plus new files, so unchanged images are not uploaded again; the RPC validates every existing row belongs to the project and applies order, cover, add, and remove changes atomically. Project deletion removes database rows first in a transaction. Only afterward does a durable cleanup queue attempt to delete Cloudinary assets that are no longer referenced by a gallery row or project cover. Cleanup failures remain visible in the dashboard and can be retried. Replaced or removed Supabase-backed images, including the intentionally excluded legacy image, lose only their database relationship; the Supabase object is never deleted.

Before enabling these routes in a deployed environment, review and separately apply `supabase/migrations/202611120001_cloudinary_project_image_lifecycle.sql`. That prepared migration adds image provider, Cloudinary ID, and order metadata; backfills IDs only from exact verified mapping URL/ID pairs; keeps the public project reads needed by the website; reserves mutations and lifecycle RPCs for the server service role; and creates the durable cleanup queue. It has not been run against production as part of this code change. Existing project and gallery rendering continues to use the same URL columns, so no image URL rewrite is required for this lifecycle change.

## 📞 Contact

- **Email**: info@alsarh.com
- **Phone**: +20 104 408 8731
- **Location**: 6 October City, Cairo, Egypt
