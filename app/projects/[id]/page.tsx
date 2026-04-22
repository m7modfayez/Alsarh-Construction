'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, ArrowRight, MessageCircle } from 'lucide-react';
import ProjectGallery from '@/components/ProjectGallery';
import ProjectCard from '@/components/ProjectCard';
import { supabase } from '@/lib/supabaseClient'
import { Project } from '@/types'

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Project Detail Page
 * Displays detailed information about a specific project
 */
export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string>('')
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([])

  useEffect(() => {
    const getProjectId = async () => {
      const { id } = await params
      setProjectId(id)
      fetchProject(id)
    }
    getProjectId()
  }, [params])

  useEffect(() => {
    if (projectId) {
      fetchRelatedProjects().then(setRelatedProjects)
    }
  }, [projectId])

  const fetchProject = async (id: string) => {
    try {
      setLoading(true)
      
      // Fetch project with images
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          project_images (
            image_url,
            is_cover
          )
        `)
        .eq('id', id)
        .single()

      if (projectError) throw projectError

      if (!projectData) {
        setError('المشروع غير موجود')
        return
      }

      // Transform data to match expected format
      const coverImage = projectData.project_images?.find((img: any) => img.is_cover)?.image_url || projectData.cover_image
      const allImages = projectData.project_images?.map((img: any) => img.image_url) || []
      
      const transformedProject: Project = {
        id: projectData.id,
        title: projectData.title,
        description: projectData.description,
        location: projectData.location,
        year: projectData.year,
        category: 'residential' as const, // Default category
        image: coverImage,
        gallery: allImages,
        scope_of_work: projectData.scope_of_work
      }

      setProject(transformedProject)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في جلب تفاصيل المشروع')
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .neq('id', projectId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error

      return data?.map(project => {
        const coverImage = project.cover_image
        return {
          id: project.id,
          title: project.title,
          description: project.description,
          location: project.location,
          year: project.year,
          category: 'residential' as const,
          image: coverImage,
          gallery: [coverImage].filter(Boolean)
        }
      }) || []
    } catch (err) {
      console.error('Failed to fetch related projects:', err)
      return []
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">المشروع غير موجود</h1>
          <p className="text-muted-foreground mb-8">
            المشروع الذي تبحث عنه غير موجود.
          </p>
          <Link
            href="/projects"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            العودة إلى المشاريع
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Project Details */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 mb-32">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Project Header */}
              <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">{project.title}</h1>
                <div className="flex items-center gap-4 text-muted-foreground mb-8">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">{project.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">{project.year}</span>
                  </div>
                </div>
              </div>

              {/* Project Description */}
              <div className="prose prose-lg max-w-none">
                {/* <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">نظرة عامة على المشروع</h2> */}
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
                  {project.description}
                </p>
              </div>

                          </div>

            {/* Project Info Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  {/* Cover Image */}
                  <div className="relative h-48 bg-gray-100">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-bold text-xl">{project.title}</h3>
                    </div>
                  </div>
                  
                  {/* Project Details */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm text-muted-foreground font-medium">الموقع</span>
                      <span className="font-bold text-foreground">{project.location}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm text-muted-foreground font-medium">السنة</span>
                      <span className="font-bold text-foreground">{project.year}</span>
                    </div>
                    
                    {/* Divider */}
                    <div className="border-t border-gray-100 my-4"></div>
                    
                    {/* **Scope of Work** Section */}
                    {project.scope_of_work && project.scope_of_work.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm text-muted-foreground font-medium mb-3">نوع العمل</h4>
                        <ul className="space-y-2">
                          {project.scope_of_work
                            .join('+') // Convert array back to string
                            .split(/[\+,\u2022]/) // Split by +, comma, or bullet
                            .map((item: string) => item.trim())
                            .filter((item: string) => item.length > 0)
                            .map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                                <span className="text-primary mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="mt-6">
                  <Link
                    href="/projects"
                    className="inline-flex items-center justify-center w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 mr-2 rotate-180" />العودة للمشاريع</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Section */}
          <div className="mb-24">
            <div className="mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">معرض صور المشروع</h2>
              <p className="text-muted-foreground text-lg">استكشف جمال وتفاصيل المشروع من خلال معرض الصور</p>
            </div>
            <ProjectGallery images={project.gallery} title={project.title} />
          </div>

          {/* CTA Section */}
          <div className="mb-24">
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-8 md:p-12 border border-primary/20 text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">مهتم بهذا المشروع؟</h3>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                تواصل معنا لمعرفة المزيد عن هذا المشروع أو لمناقشة مشروع مشابه لاحتياجاتك.
              </p>
              <a
                href={`https://wa.me/201044088731?text=${encodeURIComponent(`السلام عليكم، أنا معجب بمشروع ${project.title} وحابب أعرف تفاصيل أكتر وإمكانية تنفيذ مشروع شبه ده.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                اسأل عن المشروع ده
              </a>
            </div>
          </div>
        </div>
      </section>
      
      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <section className="py-12 md:py-20 bg-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">مشاريع أخرى</h2>
              <p className="text-muted-foreground text-lg">استكشف المزيد من مشاريعنا المتميزة</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {relatedProjects.map((relatedProject) => (
                <ProjectCard key={relatedProject.id} project={relatedProject} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                href="/projects"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors duration-300 shadow-md hover:shadow-lg"
              >
                عرض جميع المشاريع
                <ArrowRight className="w-5 h-5 mr-2" />
              </Link>
            </div>
          </div>
        </section>
      )}

     
    </div>
  );
}
