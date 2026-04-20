# Projects CRUD Dashboard

A complete Next.js dashboard for managing construction projects with Supabase backend integration.

## Features

### 🏗️ **Core Functionality**
- **Create Projects**: Add new construction projects with details and multiple images
- **Read Projects**: View all projects in a clean card-based layout
- **Update Projects**: Edit existing projects and manage images
- **Delete Projects**: Remove projects with automatic image cleanup

### 📸 **Image Management**
- **Multiple Upload**: Upload multiple images at once
- **Cover Image**: Select one image as the project cover
- **Storage Integration**: Images stored in Supabase Storage
- **Automatic Cleanup**: Images deleted from storage when project is deleted

### 🎨 **UI/UX Features**
- **RTL Support**: Full Arabic RTL layout support
- **Responsive Design**: Works perfectly on mobile and desktop
- **Loading States**: Professional loading indicators
- **Error Handling**: Graceful error messages and recovery
- **Modern UI**: Clean, minimal design with Tailwind CSS

## Setup Instructions

### 1. Supabase Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database schema**:
   - Open your Supabase project
   - Go to the SQL Editor
   - Copy and paste the contents of `supabase-schema.sql`
   - Run the SQL commands

3. **Get your credentials**:
   - Go to Project Settings → API
   - Copy the Project URL and Anon Key

### 2. Environment Setup

1. **Create environment file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Update environment variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run the Application

```bash
pnpm dev
```

Visit `http://localhost:3000/dashboard` to access the dashboard.

## Dashboard Structure

```
/dashboard
├── layout.tsx          # Dashboard layout with sidebar
├── page.tsx           # Projects listing page
├── add/
│   └── page.tsx       # Add new project page
└── edit/
    └── [id]/
        └── page.tsx   # Edit existing project page
```

## Database Schema

### Projects Table
- `id`: UUID (Primary Key)
- `title`: Project title (Required)
- `description`: Project description (Optional)
- `location`: Project location (Required)
- `year`: Project year (Required)
- `cover_image`: URL of cover image
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Project Images Table
- `id`: UUID (Primary Key)
- `project_id`: Reference to projects table
- `image_url`: URL of uploaded image
- `is_cover`: Boolean indicating if this is the cover image
- `created_at`: Creation timestamp

## Features Breakdown

### 📱 **Mobile Responsive**
- Collapsible sidebar on mobile
- Touch-friendly buttons and interactions
- Optimized image display on small screens

### 🔄 **CRUD Operations**
- **Create**: Form validation, image upload, cover selection
- **Read**: Card layout with cover images, quick actions
- **Update**: Load existing data, manage images, change cover
- **Delete**: Confirmation dialog, complete cleanup

### 🖼️ **Image Management**
- **Upload**: Multiple file selection, progress indication
- **Preview**: Image thumbnails with hover effects
- **Cover Selection**: Visual indication of cover image
- **Storage**: Automatic Supabase Storage integration

### 🎯 **User Experience**
- **Loading States**: Professional spinners and disabled states
- **Error Handling**: Clear error messages with retry options
- **Navigation**: Breadcrumbs and back navigation
- **Feedback**: Success confirmations and action feedback

## Security Notes

The current setup uses permissive RLS policies for demo purposes. In production:

1. **Restrict RLS policies** to authenticated users only
2. **Add authentication** with Supabase Auth
3. **Implement file size limits** for uploads
4. **Add input validation** and sanitization
5. **Use environment variables** for sensitive data

## Customization

### Styling
- Uses Tailwind CSS for styling
- RTL support with `dir="rtl"` and `rtl` class
- Custom colors and spacing can be adjusted in Tailwind config

### Database
- Modify `supabase-schema.sql` to add custom fields
- Update TypeScript interfaces in component files
- Adjust form validation as needed

### Storage
- Default bucket name: `projects`
- Can be configured in the schema file
- File naming includes timestamp for uniqueness

## Troubleshooting

### Common Issues

1. **Images not uploading**: Check Supabase Storage permissions
2. **Database errors**: Verify schema was applied correctly
3. **Environment variables**: Ensure `.env.local` is properly configured
4. **CORS issues**: Check Supabase CORS settings

### Debug Mode

Add console logging to debug:
```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Project ID:', projectId)
```

## Production Deployment

1. **Environment Variables**: Set all required env vars in your hosting platform
2. **Database**: Ensure Supabase is in production mode
3. **Authentication**: Implement proper user authentication
4. **Domain**: Configure your custom domain in Supabase settings
5. **Monitoring**: Set up error tracking and monitoring

## Support

For issues related to:
- **Supabase**: Check [Supabase Documentation](https://supabase.com/docs)
- **Next.js**: Check [Next.js Documentation](https://nextjs.org/docs)
- **Tailwind CSS**: Check [Tailwind Documentation](https://tailwindcss.com/docs)
