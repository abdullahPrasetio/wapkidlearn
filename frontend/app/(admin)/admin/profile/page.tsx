'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { auth } from '@/lib/api'

export default function AdminProfilePage() {
  const router = useRouter()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () => auth.changePassword(current, next),
    onSuccess: () => {
      setSuccess(true)
      setCurrent('')
      setNext('')
      setConfirm('')
    },
  })

  const validationError =
    next && confirm && next !== confirm ? 'Password baru tidak cocok' :
    next && next.length < 8 ? 'Password baru minimal 8 karakter' : null

  const canSubmit = current && next && confirm && next === confirm && next.length >= 8 && !mutation.isPending

  return (
    <div className="min-h-screen bg-wkl-surface font-inter flex">
      {/* Sidebar placeholder — sama dengan halaman admin lain */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-wkl-outline-variant/30 bg-wkl-surface-lowest sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-wkl-outline-variant/30">
          <span className="text-lg font-bold text-wkl-primary tracking-tight">WapKidLearn</span>
          <p className="text-xs text-wkl-on-surface-variant mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { href: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
            { href: '/admin/questions', icon: 'quiz', label: 'Bank Soal' },
            { href: '/admin/videos', icon: 'play_circle', label: 'Review Video' },
            { href: '/admin/users', icon: 'group', label: 'Kelola User' },
            { href: '/admin/profile', icon: 'manage_accounts', label: 'Profil' },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                item.href === '/admin/profile'
                  ? 'bg-wkl-secondary-container text-wkl-on-secondary-container'
                  : 'text-wkl-on-surface-variant hover:bg-wkl-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-wkl-surface border-b border-wkl-outline-variant/30 px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-wkl-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-wkl-on-surface text-[22px]">arrow_back</span>
          </button>
          <h1 className="text-base font-semibold text-wkl-on-surface">Profil Admin</h1>
        </div>

        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          <div className="bg-wkl-surface-container rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-wkl-primary text-[22px]">lock_reset</span>
              <h2 className="text-sm font-semibold text-wkl-on-surface">Ganti Password</h2>
            </div>

            {success && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-green-600 text-[18px]">check_circle</span>
                <p className="text-green-700 text-sm font-medium">Password berhasil diubah.</p>
              </div>
            )}

            {mutation.isError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
                <p className="text-red-600 text-sm">{(mutation.error as Error).message}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-wkl-on-surface-variant">Password Saat Ini</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-wkl-on-surface-variant text-[20px]">lock</span>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={current}
                  onChange={e => setCurrent(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-wkl-outline-variant bg-wkl-surface text-wkl-on-surface text-sm focus:outline-none focus:border-wkl-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-wkl-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[20px]">{showCurrent ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-wkl-on-surface-variant">Password Baru</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-wkl-on-surface-variant text-[20px]">lock_open</span>
                <input
                  type={showNext ? 'text' : 'password'}
                  value={next}
                  onChange={e => setNext(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-wkl-outline-variant bg-wkl-surface text-wkl-on-surface text-sm focus:outline-none focus:border-wkl-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowNext(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-wkl-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[20px]">{showNext ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-wkl-on-surface-variant">Konfirmasi Password Baru</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-wkl-on-surface-variant text-[20px]">lock_open</span>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Ulangi password baru"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-wkl-surface text-wkl-on-surface text-sm focus:outline-none ${
                    validationError ? 'border-red-400 focus:border-red-400' : 'border-wkl-outline-variant focus:border-wkl-primary'
                  }`}
                />
              </div>
              {validationError && (
                <p className="text-xs text-red-500 mt-1">{validationError}</p>
              )}
            </div>

            <button
              onClick={() => mutation.mutate()}
              disabled={!canSubmit}
              className="w-full py-3 rounded-xl bg-wkl-primary text-white font-semibold text-sm disabled:opacity-40 transition-opacity"
            >
              {mutation.isPending ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
