'use client'

import { useState, useEffect } from 'react'
import ProjectCard from '@/components/ProjectCard'
import { supabase } from '@/lib/supabaseClient'
import { Project } from '@/types'

/**
 * Projects Page
 * Displays all projects in a unified grid
 */
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      
      // Fetch projects with their images
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          project_images (
            image_url,
            is_cover
          )
        `)
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      // Transform data to match expected format
      const transformedProjects = projectsData?.map(project => {
        const coverImage = project.project_images?.find((img: any) => img.is_cover)?.image_url || project.cover_image
        const allImages = project.project_images?.map((img: any) => img.image_url) || []
        
        return {
          id: project.id,
          title: project.title,
          description: project.description,
          location: project.location,
          year: project.year,
          category: 'residential' as const, // Default category
          image: coverImage,
          gallery: allImages
        }
      }) || []

      setProjects(transformedProjects)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في جلب المشاريع')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={fetchProjects}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Projects Section */}
      <section id="projects" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              المشاريع
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              استكشف أحدث إنجازاتنا المعمارية والمشاريع المكتملة
            </p>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}
