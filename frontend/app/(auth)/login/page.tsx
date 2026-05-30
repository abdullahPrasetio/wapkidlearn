'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/api'
import { setStoredRole, getRedirectPath } from '@/lib/auth'
import type { Role } from '@/lib/types'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { role } = await auth.login(email, password)
      setStoredRole(role as Role)
      router.replace(getRedirectPath(role as Role))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-wkl-surface-lowest text-wkl-on-surface font-sans min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px] flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-16 h-16 rounded-full bg-wkl-primary-container flex items-center justify-center text-2xl mb-2">
            🦉
          </div>
          <h1 className="text-2xl font-bold text-wkl-on-surface">Panel Orang Tua</h1>
          <p className="text-sm text-wkl-on-surface-variant">Masuk untuk memantau perkembangan belajar anak Anda.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-wkl-on-surface-variant ml-1" htmlFor="email">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-wkl-on-surface-variant text-xl">mail</span>
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="contoh@email.com"
                className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-wkl-outline-variant rounded focus:outline-none focus:border-wkl-secondary focus:ring-4 focus:ring-wkl-secondary/20 transition-all text-sm text-wkl-on-surface placeholder-wkl-on-surface-variant/50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-wkl-on-surface-variant ml-1" htmlFor="password">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-wkl-on-surface-variant text-xl">lock</span>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-white border-2 border-wkl-outline-variant rounded focus:outline-none focus:border-wkl-secondary focus:ring-4 focus:ring-wkl-secondary/20 transition-all text-sm text-wkl-on-surface placeholder-wkl-on-surface-variant/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-wkl-on-surface-variant hover:text-wkl-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-wkl-error text-center bg-wkl-error-container rounded p-2">{error}</p>
          )}

          <div className="flex flex-col gap-6 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-wkl-primary-container text-white font-semibold text-base h-11 rounded flex items-center justify-center hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </button>

            <Link
              href="/child-login"
              className="w-full flex items-center justify-center gap-1 text-wkl-primary text-sm font-semibold hover:opacity-80 transition-opacity"
            >
              Masuk sebagai Anak
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
