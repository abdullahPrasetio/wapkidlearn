'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/child/home',
    label: 'Home',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? '#F97316' : 'none'} stroke={active ? '#F97316' : '#9CA3AF'} strokeWidth={2} className="w-6 h-6">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" stroke={active ? '#fff' : '#9CA3AF'} />
      </svg>
    ),
  },
  {
    href: '/child/learn',
    label: 'Belajar',
    matchPaths: ['/child/learn', '/child/game', '/child/read'],
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#F97316' : '#9CA3AF'} strokeWidth={2} className="w-6 h-6">
        <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/child/watch',
    label: 'Nonton',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#F97316' : '#9CA3AF'} strokeWidth={2} className="w-6 h-6">
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <path d="M8 20h8M12 18v2" strokeLinecap="round" />
        <path d="M10 9l5 3-5 3V9z" fill={active ? '#F97316' : '#9CA3AF'} stroke="none" />
      </svg>
    ),
  },
  {
    href: '/child/achievements',
    label: 'Lencana',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#F97316' : '#9CA3AF'} strokeWidth={2} className="w-6 h-6">
        <path d="M12 15c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6z" />
        <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/child/rewards',
    label: 'Poin',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#F97316' : '#9CA3AF'} strokeWidth={2} className="w-6 h-6">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export function ChildBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md sm:max-w-xl md:max-w-2xl bg-white border-t border-gray-100 shadow-lg z-40">
      <div className="grid grid-cols-5 py-1 sm:py-3">
        {NAV_ITEMS.map((item) => {
          const active = item.matchPaths
            ? item.matchPaths.some((p) => pathname.startsWith(p))
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 py-2"
            >
              {item.icon(active)}
              <span className={`text-[10px] sm:text-xs font-semibold ${active ? 'text-orange-500' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
