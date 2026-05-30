'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { admin } from '@/lib/api'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  super_admin: { label: 'Admin', className: 'bg-wkl-tertiary-fixed text-[#5a4300]' },
  parent: { label: 'Parent', className: 'bg-wkl-secondary-fixed text-[#004395]' },
  child: { label: 'Anak', className: 'bg-wkl-primary-fixed text-wkl-primary' },
}

function initials(email: string) {
  return email.split('@')[0].slice(0, 2).toUpperCase()
}

export default function AdminUsersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: admin.listUsers,
  })

  const toggleMut = useMutation({
    mutationFn: admin.toggleUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const filtered = users?.filter((u) =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  return (
    <div className="bg-wkl-surface text-wkl-on-background min-h-screen pb-20">
      {/* Header */}
      <header className="bg-wkl-surface border-b border-wkl-outline-variant flex justify-between items-center w-full px-6 py-4 sticky z-40 top-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-wkl-primary">WapKidLearn</span>
        </div>
        <button className="text-wkl-on-surface-variant hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Kelola User</h1>
          <p className="text-sm text-wkl-on-surface-variant">Manage application access and roles.</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-wkl-on-surface-variant">search</span>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border-2 border-wkl-outline-variant rounded focus:outline-none focus:border-wkl-secondary focus:ring-4 focus:ring-wkl-secondary/20 text-sm bg-wkl-surface-lowest"
            placeholder="Search users by name or email..."
          />
        </div>

        {/* User list */}
        {!users ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-wkl-surface-lowest border border-[#E5E7EB] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((u) => {
              const badge = ROLE_BADGE[u.role] ?? { label: u.role, className: 'bg-wkl-surface-container text-wkl-on-surface-variant' }
              const avatarBg = u.role === 'super_admin' ? 'bg-wkl-tertiary-fixed text-[#5a4300]' : u.role === 'parent' ? 'bg-wkl-secondary-container text-wkl-on-secondary-container' : 'bg-wkl-primary-container text-white'
              return (
                <div key={u.id} className={`bg-wkl-surface-lowest border border-[#E5E7EB] rounded-lg p-4 flex items-center justify-between ${!u.is_active ? 'opacity-75' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-full ${avatarBg} flex items-center justify-center text-base font-bold shrink-0`}>
                      {initials(u.email || 'UN')}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-wkl-on-background">{u.email || '(no email)'}</h3>
                      <p className="text-xs text-wkl-on-surface-variant font-mono truncate max-w-[180px]">{u.id}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>{badge.label}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={u.is_active}
                        onChange={() => {
                          const action = u.is_active ? 'nonaktifkan' : 'aktifkan'
                          if (confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} user ini?`)) toggleMut.mutate(u.id)
                        }}
                        disabled={toggleMut.isPending}
                      />
                      <div className="w-11 h-6 bg-wkl-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22C55E]" />
                    </label>
                    <span className={`text-xs font-medium ${u.is_active ? 'text-[#22C55E]' : 'text-wkl-on-surface-variant'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <p className="text-wkl-on-surface-variant text-sm text-center py-8">
                {search ? 'Tidak ada user yang cocok.' : 'Belum ada user.'}
              </p>
            )}
          </div>
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav className="bg-wkl-surface-lowest border-t border-wkl-outline-variant fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe pt-1 md:hidden h-[72px]">
        {[
          { href: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
          { href: '/admin/videos', icon: 'movie', label: 'Video' },
          { href: '/admin/users', icon: 'settings', label: 'Settings', active: true },
        ].map((item) => (
          <a key={item.href} href={item.href} className={`flex flex-col items-center justify-center w-16 h-full rounded-lg transition-colors ${item.active ? 'bg-wkl-primary-container text-white rounded-full px-4 py-1' : 'text-wkl-on-surface-variant hover:bg-wkl-surface-variant'}`}>
            <span className="material-symbols-outlined" style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
            <span className="text-[10px] mt-1">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
