-- Supabase Database Schema for Projects CRUD Dashboard
-- Run these SQL commands in your Supabase SQL Editor

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'residential',
  scope_of_work TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  cover_image TEXT,
  cover_image_public_id TEXT,
  cover_image_provider TEXT NOT NULL DEFAULT 'supabase' CHECK (cover_image_provider IN ('supabase', 'cloudinary')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_images table
CREATE TABLE IF NOT EXISTS project_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  cloudinary_public_id TEXT,
  image_provider TEXT NOT NULL DEFAULT 'supabase' CHECK (image_provider IN ('supabase', 'cloudinary')),
  image_order INTEGER NOT NULL DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'projects',
  'projects',
  true
) ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS) policies
-- Enable RLS on tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;

-- Public rendering stays readable; project mutations run through authenticated
-- server routes and their transactional RPCs.
CREATE POLICY "Public can read projects" ON projects
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can read project images" ON project_images
  FOR SELECT TO anon, authenticated USING (true);

-- Preserve public delivery for legacy Supabase URLs while retiring client writes.
CREATE POLICY "Public can read legacy project images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'projects');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON project_images(project_id);
CREATE INDEX IF NOT EXISTS idx_project_images_is_cover ON project_images(is_cover);
CREATE INDEX IF NOT EXISTS idx_project_images_cloudinary_public_id
  ON project_images(cloudinary_public_id) WHERE cloudinary_public_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_project_images_project_order
  ON project_images(project_id, image_order, id);
CREATE INDEX IF NOT EXISTS idx_projects_cover_cloudinary_public_id
  ON projects(cover_image_public_id) WHERE cover_image_public_id IS NOT NULL;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
