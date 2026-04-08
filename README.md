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

## 📞 Contact

- **Email**: info@alsarh.com
- **Phone**: +20 104 408 8731
- **Location**: 6 October City, Cairo, Egypt
