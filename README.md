# الصرح - Alsarh

Alsarh is a construction and architectural services website. It presents the company's services and project portfolio and provides contact information for prospective clients.

## Features

- Responsive Arabic website with home, projects, and service pages
- Project listings, detail pages, image galleries, and lightbox navigation
- Dashboard authentication and project management
- Contact information and map links
- Server-side Cloudinary image uploads for project management

## Technologies

- Next.js App Router and React
- TypeScript
- Tailwind CSS
- Supabase for authentication and project data
- Cloudinary and Sharp for project image storage and processing
- pnpm

## Requirements

- Node.js 20 or newer
- pnpm
- Supabase project URL and publishable key
- Supabase service-role key and Cloudinary credentials for dashboard project management

## Local setup

Install dependencies:

```bash
pnpm install
```

Create `.env.local` with the environment variable names required by the features you use:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

The Supabase service-role key and Cloudinary API secret are server-only. Never expose them through `NEXT_PUBLIC_` variables.

Dashboard and admin API access requires a valid Supabase Auth session. Keep public signup disabled and let the project owner control account creation; every account that can sign in has dashboard access. See [AUTH_SETUP.md](./AUTH_SETUP.md).

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Common commands

```bash
pnpm dev       # Start the development server
pnpm lint      # Run ESLint
pnpm build     # Create a production build
pnpm start     # Start the production build
```

## Project images

Dashboard uploads accept JPEG, PNG, WebP, and AVIF source images. The server validates and decodes each image with Sharp, then stores an optimized WebP asset in Cloudinary. Supabase stores project data and image references. Existing legacy Supabase Storage images remain readable.

## Contact

- Email: info@alsarh.com
- Phone: +20 104 408 8731
- Location: 6 October City, Cairo, Egypt
