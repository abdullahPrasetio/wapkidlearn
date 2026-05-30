'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/admin/questions', icon: 'menu_book', label: 'Bank Soal' },
  { href: '/admin/videos', icon: 'movie', label: 'Review Video' },
  { href: '/admin/users', icon: 'group', label: 'Kelola User' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex flex-col h-screen fixed left-0 top-0 py-8 bg-wkl-surface-low border-r border-wkl-outline-variant w-60 z-40">
      <div className="px-4 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-wkl-primary-container text-white flex items-center justify-center font-bold text-sm shrink-0">
          WK
        </div>
        <div>
          <div className="font-bold text-wkl-primary text-sm leading-tight">WapKidAdmin</div>
          <div className="text-xs text-wkl-on-surface-variant">Manage Learning</div>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-wkl-secondary-container text-wkl-on-secondary-container font-semibold'
                  : 'text-wkl-on-surface-variant hover:bg-wkl-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
