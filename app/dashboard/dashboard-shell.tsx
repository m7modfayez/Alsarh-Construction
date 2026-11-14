'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, FolderOpen, Plus, LogOut } from 'lucide-react'
import { logout } from '@/app/actions/auth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const navigation = [
    { name: 'المشاريع', href: '/dashboard', icon: FolderOpen },
    { name: 'إضافة مشروع', href: '/dashboard/add', icon: Plus },
  ]

  return (
    <div className="min-h-screen bg-gray-50 rtl" dir="rtl">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b lg:border-none">
          <h1 className="text-xl font-bold text-gray-900">لوحة التحكم</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-8 px-4 flex-1">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon className="ml-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t mt-auto">
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:mr-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">لوحة التحكم</h1>
            <button
              onClick={() => logout()}
              className="p-2 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50"
              title="تسجيل الخروج"
            >
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
