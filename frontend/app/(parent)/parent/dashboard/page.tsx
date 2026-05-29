'use client'

import { useQuery } from '@tanstack/react-query'
import { parent, auth } from '@/lib/api'
import { clearStoredRole } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ParentDashboardPage() {
  const router = useRouter()
  const { data: children, isLoading } = useQuery({
    queryKey: ['children'],
    queryFn: parent.listChildren,
  })

  const handleLogout = async () => {
    await auth.logout().catch(() => {})
    clearStoredRole()
    router.replace('/login')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between pt-4">
        <div>
          <p className="text-gray-500 text-sm">Dashboard</p>
          <h1 className="text-2xl font-bold text-gray-900">Anak Saya</h1>
        </div>
        <button onClick={handleLogout} className="text-gray-400 text-sm hover:text-gray-600">
          Keluar
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : !children?.length ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">👶</div>
          <p className="text-gray-500">Belum ada anak terdaftar</p>
          <Link
            href="/parent/children/new"
            className="mt-4 inline-block bg-orange-500 text-white font-bold px-6 py-3 rounded-xl"
          >
            + Tambah Anak
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/parent/children/${child.id}`}
              className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                  {child.is_locked ? '🔒' : '🦊'}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{child.display_name}</p>
                  <p className="text-gray-500 text-sm">Kelas {child.grade_level} • Level {child.current_level}</p>
                </div>
              </div>
              {child.is_locked && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Terkunci</span>
              )}
            </Link>
          ))}
          <Link
            href="/parent/children/new"
            className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-2xl p-4 text-gray-500 text-sm font-medium transition"
          >
            + Tambah Anak
          </Link>
        </div>
      )}
    </div>
  )
}
