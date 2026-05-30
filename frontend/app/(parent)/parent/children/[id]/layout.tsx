'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { slug: '', icon: 'person', label: 'Profil' },
  { slug: 'analytics', icon: 'bar_chart', label: 'Analitik' },
  { slug: 'settings', icon: 'settings', label: 'Pengaturan' },
  { slug: 'videos', icon: 'play_circle', label: 'Video' },
  { slug: 'activity', icon: 'assignment', label: 'Aktivitas' },
]

export default function ChildLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const { id } = params
  const path = usePathname()

  return (
    <div className="min-h-screen bg-wkl-background">
      {/* Tab nav */}
      <nav className="bg-wkl-surface-lowest border-b border-wkl-outline-variant sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-2 flex overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const href = `/parent/children/${id}${tab.slug ? `/${tab.slug}` : ''}`
            const active = tab.slug === ''
              ? path === `/parent/children/${id}`
              : path.startsWith(`/parent/children/${id}/${tab.slug}`)
            return (
              <Link
                key={tab.slug}
                href={href}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0 ${
                  active
                    ? 'border-wkl-primary text-wkl-primary'
                    : 'border-transparent text-wkl-on-surface-variant hover:text-wkl-on-surface'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {children}
    </div>
  )
}
