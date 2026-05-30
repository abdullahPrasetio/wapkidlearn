'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { admin, auth } from '@/lib/api'
import { clearStoredRole } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

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

  const stats = [
    { label: 'Total Soal', value: questions?.length ?? 0, loading: loadingQ, icon: 'library_books', iconColor: 'text-wkl-secondary', iconBg: 'bg-wkl-surface-low', accent: false },
    { label: 'Total User', value: users?.length ?? 0, loading: loadingU, icon: 'group', iconColor: 'text-wkl-primary', iconBg: 'bg-wkl-surface-low', accent: false },
    { label: 'Video Pending', value: pendingVideos, loading: loadingV, icon: 'movie', iconColor: 'text-wkl-error', iconBg: 'bg-wkl-error-container', accent: true },
  ]

  const quickActions = [
    { href: '/admin/questions', icon: '📝', label: 'Bank Soal' },
    { href: '/admin/videos', icon: '🎬', label: 'Review Video' },
    { href: '/admin/users', icon: '👥', label: 'Kelola User' },
  ]

  return (
    <div className="flex">
      <AdminSidebar />

      <div className="flex-1 md:ml-60 min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-wkl-surface border-b border-wkl-outline-variant flex justify-between items-center w-full px-6 py-4 md:px-8 z-30 sticky top-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-wkl-on-surface-variant p-2 rounded-full hover:bg-wkl-surface-variant">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-wkl-primary-container overflow-hidden flex items-center justify-center text-white font-bold text-sm shrink-0">
              WK
            </div>
            <h1 className="text-xl font-bold text-wkl-primary">WapKidLearn</h1>
          </div>
          <button onClick={handleLogout} className="text-wkl-primary hover:opacity-80 transition-opacity p-2 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 flex flex-col gap-8">
          <div>
            <h2 className="text-2xl font-bold text-wkl-on-background">Overview</h2>
            <p className="text-sm text-wkl-on-surface-variant mt-1">Track platform metrics and manage content.</p>
          </div>

          {/* Stat Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-wkl-surface-lowest border border-wkl-outline-variant rounded-xl p-6 flex flex-col justify-between min-h-[120px] relative overflow-hidden">
                {s.accent && <div className="absolute top-0 right-0 w-16 h-16 bg-wkl-error-container rounded-bl-full opacity-50" />}
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-sm text-wkl-on-surface-variant">{s.label}</span>
                  <div className={`w-8 h-8 rounded-full ${s.iconBg} ${s.iconColor} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-xl">{s.icon}</span>
                  </div>
                </div>
                <div className="mt-4 text-4xl font-bold text-wkl-on-background tracking-tight relative z-10">
                  {s.loading ? <div className="h-10 w-16 bg-wkl-surface-variant rounded animate-pulse" /> : s.value.toLocaleString()}
                </div>
              </div>
            ))}
          </section>

          {/* Quick Actions */}
          <section className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-wkl-on-background">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((a) => (
                <Link key={a.href} href={a.href} className="group bg-wkl-surface-lowest border border-wkl-outline-variant rounded-xl p-4 flex items-center justify-between hover:bg-wkl-surface-container transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-wkl-surface-container flex items-center justify-center group-hover:bg-wkl-surface-high transition-colors text-lg">
                      {a.icon}
                    </div>
                    <span className="text-base font-semibold text-wkl-on-background">{a.label}</span>
                  </div>
                  <span className="material-symbols-outlined text-wkl-on-surface-variant group-hover:text-wkl-on-background transition-colors">chevron_right</span>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
