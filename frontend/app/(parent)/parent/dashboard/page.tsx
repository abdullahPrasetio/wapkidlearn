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
    <div className="min-h-screen bg-wkl-background pb-8">
      {/* Header */}
      <header className="bg-wkl-surface-lowest border-b border-wkl-outline-variant flex justify-between items-center w-full px-6 py-4 sticky top-0 z-50">
        <h1 className="text-xl font-bold text-wkl-on-surface">Anak Saya 👨‍👩‍👧</h1>
        <button
          onClick={handleLogout}
          className="text-wkl-on-surface-variant hover:text-wkl-error transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-2xl">logout</span>
        </button>
      </header>

      <main className="px-4 py-6 md:max-w-2xl md:mx-auto">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-24 animate-pulse border border-wkl-outline-variant" />
            ))}
          </div>
        ) : !children?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">👶</div>
            <p className="text-wkl-on-surface-variant mb-4">Belum ada anak terdaftar</p>
            <Link
              href="/parent/children/new"
              className="bg-wkl-primary-container text-white font-semibold px-6 py-3 rounded-lg"
            >
              + Tambah Anak
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/parent/children/${child.id}`}
                className="bg-wkl-surface-lowest border border-wkl-outline-variant rounded-xl p-4 flex items-start gap-4 shadow-sm hover:shadow-md transition"
              >
                {/* Avatar */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 shrink-0 ${child.is_locked ? 'bg-wkl-surface-variant border-wkl-outline-variant grayscale' : 'bg-wkl-surface-container border-wkl-secondary-fixed'}`}>
                  {child.is_locked ? '🔒' : '🦊'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-base font-semibold text-wkl-on-surface">{child.display_name}</h2>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${child.is_locked ? 'bg-wkl-error text-wkl-on-error' : 'bg-wkl-surface-container text-wkl-secondary'}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {child.is_locked ? 'lock' : 'check_circle'}
                      </span>
                      {child.is_locked ? 'Terkunci' : 'Aktif'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    <div className="inline-flex items-center gap-1 bg-wkl-tertiary-fixed text-wkl-on-surface px-2 py-1 rounded-lg text-xs font-medium">
                      <span className="material-symbols-outlined text-[14px]">stars</span>
                      {child.current_level * 100} Poin
                    </div>
                    <div className="inline-flex items-center gap-1 bg-wkl-surface-low text-wkl-on-surface-variant px-2 py-1 rounded-lg text-xs">
                      <span className="material-symbols-outlined text-[14px]">school</span>
                      Kelas {child.grade_level} · Level {child.current_level}
                    </div>
                  </div>

                  <button className="text-wkl-secondary text-xs font-medium flex items-center gap-1 hover:underline">
                    Lihat Progres Detail
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </Link>
            ))}

            {/* Add child */}
            <Link
              href="/parent/children/new"
              className="w-full border-2 border-dashed border-wkl-outline-variant rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-wkl-on-surface-variant hover:bg-wkl-surface-low hover:border-wkl-secondary transition-all group min-h-[100px]"
            >
              <div className="w-12 h-12 rounded-full bg-wkl-surface-highest group-hover:bg-wkl-secondary-container flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-2xl group-hover:text-wkl-on-secondary-container">add</span>
              </div>
              <span className="text-base font-semibold group-hover:text-wkl-secondary">Tambah Anak</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
