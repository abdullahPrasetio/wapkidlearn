'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { auth } from '@/lib/api'
import { clearStoredRole } from '@/lib/auth'

const NAV_ITEMS = [
  { href: '/parent/dashboard', icon: 'group', label: 'Anak' },
  { href: '/parent/profile', icon: 'account_circle', label: 'Profil' },
]

function SidebarNav() {
  const path = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await auth.logout().catch(() => {})
    clearStoredRole()
    router.replace('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-wkl-surface-lowest border-r border-wkl-outline-variant sticky top-0 shrink-0">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-wkl-outline-variant">
          <span className="text-2xl">🦉</span>
          <span className="font-extrabold text-wkl-primary tracking-tight">WapKidLearn</span>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = path.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-wkl-primary-container text-white'
                    : 'text-wkl-on-surface-variant hover:bg-wkl-surface-low hover:text-wkl-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-wkl-on-surface-variant hover:bg-wkl-error-container hover:text-wkl-error transition-colors w-full"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-wkl-surface-lowest border-t border-wkl-outline-variant flex">
        {NAV_ITEMS.map((item) => {
          const active = path.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                active ? 'text-wkl-primary' : 'text-wkl-on-surface-variant'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[24px] ${active ? 'text-wkl-primary' : ''}`}
                style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium text-wkl-on-surface-variant"
        >
          <span className="material-symbols-outlined text-[24px]">logout</span>
          Keluar
        </button>
      </nav>
    </>
  )
}

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-wkl-background font-sans flex">
      <SidebarNav />
      <div className="flex-1 min-w-0 pb-16 md:pb-0">
        {children}
      </div>
    </div>
  )
}
