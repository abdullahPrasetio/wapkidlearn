'use client'

import { useQuery } from '@tanstack/react-query'
import { parent } from '@/lib/api'
import { useRouter } from 'next/navigation'
import type { ActivityItem } from '@/lib/types'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatDateLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hari Ini'
  if (d.toDateString() === yesterday.toDateString()) return 'Kemarin'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })
}

function groupByDay(activities: ActivityItem[]) {
  const groups: Record<string, ActivityItem[]> = {}
  activities.forEach((a) => {
    const label = formatDateLabel(a.occurred_at)
    if (!groups[label]) groups[label] = []
    groups[label].push(a)
  })
  return Object.entries(groups)
}

const typeConfig: Record<string, { icon: string; bg: string; detail: (a: ActivityItem) => React.ReactNode }> = {
  game: {
    icon: 'sports_esports',
    bg: 'bg-wkl-primary-fixed',
    detail: (a) => (
      <span className="font-bold text-wkl-primary-container bg-wkl-primary-fixed px-2 py-1 rounded text-sm">{a.detail}</span>
    ),
  },
  watch: {
    icon: 'play_circle',
    bg: 'bg-wkl-secondary-fixed',
    detail: (a) => (
      <span className="text-xs text-wkl-on-surface-variant bg-wkl-surface-variant px-2 py-1 rounded">{a.detail}</span>
    ),
  },
}

export default function ChildActivityPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => parent.getActivityFeed(id),
  })

  const activities = data?.activities ?? []
  const grouped = groupByDay(activities)

  return (
    <div className="bg-wkl-background text-wkl-on-surface font-sans">
      <main className="px-4 py-6 md:px-8 md:py-8 max-w-2xl mx-auto w-full">

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-wkl-surface-lowest border border-wkl-outline-variant rounded-xl h-16 animate-pulse" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-wkl-on-surface-variant font-medium">Belum ada aktivitas</p>
              <p className="text-wkl-on-surface-variant text-sm mt-1">Aktivitas belajar dan nonton akan muncul di sini</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {grouped.map(([label, items]) => (
                <section key={label}>
                  <div className="inline-block bg-wkl-surface-variant text-wkl-on-surface-variant px-4 py-1 rounded-full text-xs font-medium mb-4">
                    {label}
                  </div>
                  <div className="flex flex-col gap-2">
                    {items.map((item, i) => {
                      const cfg = typeConfig[item.type] ?? typeConfig.watch
                      return (
                        <div key={i} className="bg-wkl-surface-lowest border border-wkl-outline-variant rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className={`w-12 h-12 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                            <span className="material-symbols-outlined">{cfg.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-wkl-on-surface truncate">{item.title}</h3>
                            <p className="text-xs text-wkl-on-surface-variant flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {formatTime(item.occurred_at)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {cfg.detail(item)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}

              <div className="mt-4 text-center">
                <button className="bg-wkl-surface-container border border-wkl-outline-variant text-wkl-on-surface text-sm font-medium py-2 px-6 rounded-full hover:bg-wkl-surface-variant transition-colors">
                  Muat Lebih Banyak
                </button>
              </div>
            </div>
          )}
      </main>
    </div>
  )
}
