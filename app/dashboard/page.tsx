'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from '@/components/ResilientImage'
import { Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { runWithPendingState } from '@/lib/project-image-pending'

interface Project {
  id: string
  title: string
  location: string
  year: number
  cover_image: string | null
  is_featured: boolean
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const deletingIdsRef = useRef(new Set<string>())

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, location, year, cover_image, is_featured')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      setNotification({ type: 'error', message: err instanceof Error ? err.message : 'فشل في جلب المشاريع' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (deletingIdsRef.current.has(id)) return
    if (!confirm('هل أنت متأكد من حذف هذا المشروع؟')) return

    deletingIdsRef.current.add(id)
    setNotification(null)
    try {
      const result = await runWithPendingState(async () => {
        const response = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'فشل في حذف المشروع')
        return result
      }, (pending) => {
        setDeletingIds(prev => {
          const next = new Set(prev)
          if (pending) next.add(id)
          else next.delete(id)
          return next
        })
      })
      setProjects(prev => prev.filter(p => p.id !== id))
      if (result.cloudinaryDeletion?.failed) {
        const failures = Array.isArray(result.cloudinaryDeletion.failures) ? result.cloudinaryDeletion.failures.join('؛ ') : ''
        setNotification({ type: 'warning', message: `تم حذف المشروع بنجاح، لكن تعذر تأكيد حذف بعض صور Cloudinary.${failures ? ` ${failures}` : ''}` })
      } else if (result.cloudinaryDeletion?.referencedElsewhere?.length) {
        setNotification({ type: 'success', message: 'تم حذف المشروع. أُبقيت صور Cloudinary التي لا تزال مستخدمة في مشاريع أخرى.' })
      } else {
        setNotification({ type: 'success', message: 'تم حذف المشروع بنجاح.' })
      }
    } catch (err) {
      setNotification({ type: 'error', message: err instanceof Error ? err.message : 'فشل في حذف المشروع' })
    } finally {
      deletingIdsRef.current.delete(id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المشاريع</h1>
          <p className="text-gray-600 mt-1">{projects.length} مشروع إجمالاً</p>
        </div>
        <Link
          href="/dashboard/add"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="ml-2 h-5 w-5" />
          إضافة مشروع
        </Link>
      </div>

      {notification && (
        <div
          role={notification.type === 'error' ? 'alert' : 'status'}
          className={`mb-6 p-4 rounded-lg border ${
            notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : notification.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-green-50 border-green-200 text-green-700'
          }`}
        >
          {notification.message}
        </div>
      )}

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
            <div
              key={project.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
                project.is_featured ? 'border border-amber-200 ring-1 ring-amber-100' : ''
              }`}
            >
              {/* Cover Image */}
              <div className="relative h-48 bg-gray-200">
                {project.cover_image ? (
                  <Image
                    src={project.cover_image}
                    alt={project.title}
                    fill
                    // ✅ FIX: Added sizes prop — without this, Next.js downloads a
                    // full-viewport-width image for what is only a ~350px wide card thumbnail.
                    // This was downloading 4–8× more image data than necessary.
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <span>لا توجد صورة</span>
                  </div>
                )}

                {project.is_featured && (
                  <div className="absolute top-3 right-3 rounded-full border border-amber-200 bg-amber-50/95 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm backdrop-blur-sm">
                    مميز
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
                      disabled={deletingIds.has(project.id)}
                      aria-busy={deletingIds.has(project.id)}
                      aria-label={`حذف ${project.title}`}
                      className="inline-flex items-center gap-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-60"
                      title={deletingIds.has(project.id) ? 'جارٍ حذف المشروع...' : 'حذف المشروع'}
                    >
                      {deletingIds.has(project.id)
                        ? <><Loader2 className="h-4 w-4 animate-spin" /><span className="text-xs">جارٍ الحذف...</span></>
                        : <Trash2 className="h-4 w-4" />}
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
