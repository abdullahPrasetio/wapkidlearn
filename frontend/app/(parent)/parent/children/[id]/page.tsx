'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parent } from '@/lib/api'
import { avatarDisplay } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ChildDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const qc = useQueryClient()

  const { data: children, isLoading } = useQuery({ queryKey: ['children'], queryFn: parent.listChildren })
  const child = children?.find((c) => c.id === id)

  const { data: analytics } = useQuery({
    queryKey: ['analytics', id],
    queryFn: () => parent.getAnalytics(id),
    enabled: !!child,
  })

  const lockMutation = useMutation({
    mutationFn: () => (child?.is_locked ? parent.unlock(id) : parent.lock(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['children'] }),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-wkl-background">
        <div className="h-14 bg-wkl-surface-lowest border-b border-wkl-outline-variant animate-pulse" />
        <div className="p-6 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-32 h-32 rounded-full bg-wkl-surface-variant animate-pulse" />
            <div className="h-6 w-40 bg-wkl-surface-variant rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-wkl-surface-lowest rounded-xl border border-wkl-outline-variant animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!child) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-wkl-background">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-wkl-on-surface font-semibold">Anak tidak ditemukan</p>
        <Link href="/parent/dashboard" className="mt-4 text-wkl-secondary text-sm font-medium">
          ← Kembali ke Dashboard
        </Link>
      </div>
    )
  }

  const actionCards = [
    { href: `/parent/children/${id}/analytics`, icon: 'bar_chart', label: 'Analitik', sub: 'Perkembangan belajar', bg: 'bg-[#F3E8FF]', color: 'text-[#9333EA]' },
    { href: `/parent/children/${id}/settings`, icon: 'settings', label: 'Pengaturan', sub: 'Batas waktu & akses', bg: 'bg-[#E1EFFE]', color: 'text-[#1D4ED8]' },
    { href: `/parent/children/${id}/videos`, icon: 'play_circle', label: 'Video', sub: 'Riwayat tontonan', bg: 'bg-[#FFE4E6]', color: 'text-[#E11D48]' },
    { href: `/parent/children/${id}/activity`, icon: 'assignment', label: 'Aktivitas', sub: 'Tugas & latihan', bg: 'bg-[#DCFCE7]', color: 'text-[#15803D]' },
  ]

  return (
    <div className="min-h-screen bg-wkl-background pb-6">
      <main className="pb-6 px-4 md:px-8 max-w-2xl mx-auto w-full">
        {/* Hero Profile */}
        <section className="flex flex-col items-center mb-8 mt-4">
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-full bg-wkl-surface-container border-4 border-wkl-surface-lowest shadow-md flex items-center justify-center text-5xl">
              {avatarDisplay(child.avatar)}
            </div>
            {/* Lock toggle badge */}
            <button
              onClick={() => lockMutation.mutate()}
              disabled={lockMutation.isPending}
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full flex items-center gap-1 shadow-sm transition-colors w-max text-white text-xs font-bold tracking-wide disabled:opacity-50 ${
                child.is_locked ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {child.is_locked ? 'lock' : 'lock_open'}
              </span>
              {lockMutation.isPending ? '...' : child.is_locked ? 'LOCKED' : 'UNLOCKED'}
            </button>
          </div>
          <h1 className="text-xl font-semibold text-wkl-on-surface mb-1">{child.display_name}</h1>
          <p className="text-xs text-wkl-on-surface-variant font-mono mb-1">@{child.username}</p>
          <p className="text-sm text-wkl-on-surface-variant bg-wkl-surface-high px-3 py-1 rounded-full border border-wkl-outline-variant/30">
            Kelas {child.grade_level} SD
          </p>
        </section>

        {/* Stats row */}
        <section className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
          <div className="bg-wkl-surface-lowest border border-wkl-outline-variant/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-[#D97706] fill" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            </div>
            <div className="text-xl font-bold text-wkl-on-surface leading-none mb-1">
              {analytics ? analytics.points_per_day.reduce((s, d) => s + d.points, 0) : child.current_level * 100}
            </div>
            <div className="text-xs text-wkl-on-surface-variant uppercase tracking-wider">Total Poin</div>
          </div>
          <div className="bg-wkl-surface-lowest border border-wkl-outline-variant/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-[#2563EB]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
            </div>
            <div className="text-xl font-bold text-wkl-on-surface leading-none mb-1">
              {analytics ? `${analytics.watch_time_per_day.reduce((s, d) => s + d.minutes, 0)}m` : '—'}
            </div>
            <div className="text-xs text-wkl-on-surface-variant uppercase tracking-wider">Waktu Nonton</div>
          </div>
          <div className="bg-wkl-surface-lowest border border-wkl-outline-variant/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-[#FFEDD5] flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-[#EA580C]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            </div>
            <div className="text-xl font-bold text-wkl-on-surface leading-none mb-1">
              {analytics?.current_streak ?? 0}
            </div>
            <div className="text-xs text-wkl-on-surface-variant uppercase tracking-wider">Hari Streak</div>
          </div>
        </section>

        {/* 2x2 action grid */}
        <section className="grid grid-cols-2 gap-4">
          {actionCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-wkl-surface-lowest border border-wkl-outline-variant/50 rounded-xl p-6 flex flex-col items-center text-center hover:bg-wkl-surface-low transition-colors active:scale-95"
            >
              <div className={`w-14 h-14 rounded-full ${card.bg} flex items-center justify-center mb-4`}>
                <span className={`material-symbols-outlined ${card.color} text-[32px]`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {card.icon}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-wkl-on-surface">{card.label}</h3>
              <p className="text-xs text-wkl-on-surface-variant mt-1">{card.sub}</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  )
}
