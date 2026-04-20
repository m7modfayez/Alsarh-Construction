'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Edit, Trash2, Plus, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface Project {
  id: string
  title: string
  description: string
  location: string
  year: number
  cover_image: string
  created_at: string
}

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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في جلب المشاريع')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشروع؟')) return

    try {
      // First get project to find associated images
      const { data: project } = await supabase
        .from('projects')
        .select('cover_image')
        .eq('id', id)
        .single()

      if (project?.cover_image) {
        // Extract file path from URL
        const filePath = project.cover_image.split('/').pop()
        if (filePath) {
          await supabase.storage
            .from('projects')
            .remove([filePath])
        }
      }

      // Delete project images
      const { data: images } = await supabase
        .from('project_images')
        .select('image_url')
        .eq('project_id', id)

      if (images) {
        const filePaths = images
          .map(img => img.image_url.split('/').pop())
          .filter(Boolean) as string[]

        if (filePaths.length > 0) {
          await supabase.storage
            .from('projects')
            .remove(filePaths)
        }
      }

      // Delete project images records
      await supabase
        .from('project_images')
        .delete()
        .eq('project_id', id)

      // Delete project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Refresh projects list
      fetchProjects()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل في حذف المشروع')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">{error}</div>
        <button
          onClick={fetchProjects}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          إعادة المحاولة
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المشاريع</h1>
          <p className="text-gray-600 mt-1">إدارة جميع مشاريع البناء</p>
        </div>
        <Link
          href="/dashboard/add"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="ml-2 h-5 w-5" />
          إضافة مشروع جديد
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-500 text-lg mb-4">لا توجد مشاريع بعد</div>
          <Link
            href="/dashboard/add"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="ml-2 h-5 w-5" />
            إضافة مشروع جديد
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Cover Image */}
              <div className="relative h-48 bg-gray-200">
                {project.cover_image ? (
                  <Image
                    src={project.cover_image}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <span>لا توجد صورة</span>
                  </div>
                )}
              </div>

              {/* Project Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>📍 {project.location}</p>
                  <p>📅 {project.year}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex space-x-reverse space-x-2">
                    <Link
                      href={`/projects/${project.id}`}
                      target="_blank"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="عرض المشروع"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/dashboard/edit/${project.id}`}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="تعديل المشروع"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف المشروع"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
