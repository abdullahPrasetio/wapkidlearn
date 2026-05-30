'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { admin, auth } from '@/lib/api'
import { clearStoredRole } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { data: questions, isLoading: loadingQ } = useQuery({ queryKey: ['admin-questions'], queryFn: admin.listQuestions })
  const { data: users, isLoading: loadingU } = useQuery({ queryKey: ['admin-users'], queryFn: admin.listUsers })
  const { data: vids, isLoading: loadingV } = useQuery({ queryKey: ['admin-videos'], queryFn: admin.listVideos })

  const handleLogout = async () => {
    await auth.logout().catch(() => {})
    clearStoredRole()
    router.replace('/login')
  }

  const pendingVideos = vids?.filter((v) => v.status === 'pending').length ?? 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between pt-4">
        <div>
          <p className="text-gray-500 text-sm">Super Admin</p>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <button onClick={handleLogout} className="text-gray-400 text-sm">Keluar</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
          {loadingQ ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse mx-auto w-10 mb-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{questions?.length ?? 0}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Soal</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
          {loadingU ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse mx-auto w-10 mb-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{users?.length ?? 0}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">User</p>
        </div>
        <div className={`rounded-2xl p-4 text-center border shadow-sm ${pendingVideos > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'}`}>
          {loadingV ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse mx-auto w-10 mb-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{pendingVideos}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Video Pending</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-3">
        <Link
          href="/admin/questions"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📝</span>
            <div>
              <p className="font-bold text-gray-900">Soal Matematika</p>
              <p className="text-gray-500 text-sm">Kelola bank soal</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </Link>

        <Link
          href="/admin/videos"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🎬</span>
            <div>
              <p className="font-bold text-gray-900">Video Global</p>
              <p className="text-gray-500 text-sm">{pendingVideos > 0 ? `${pendingVideos} video menunggu review` : 'Kelola video global'}</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </Link>

        <Link
          href="/admin/users"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">👥</span>
            <div>
              <p className="font-bold text-gray-900">User</p>
              <p className="text-gray-500 text-sm">Kelola akun pengguna</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </Link>
      </div>
    </div>
  )
}
