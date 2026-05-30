'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { parent } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const AVATARS = ['🦊', '🐼', '🐸', '🦁', '🐯', '🐻', '🐧', '🦄']

export default function NewChildPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [gradeLevel, setGradeLevel] = useState(1)
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      parent.addChild({ display_name: displayName, username, pin, grade_level: gradeLevel, avatar }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['children'] })
      router.replace('/parent/dashboard')
    },
    onError: (e: Error) => {
      setError(e.message || 'Gagal menambahkan anak')
    },
  })

  const handlePinInput = (digit: string, field: 'pin' | 'confirm') => {
    const setter = field === 'pin' ? setPin : setConfirmPin
    const current = field === 'pin' ? pin : confirmPin
    if (digit === 'del') {
      setter(current.slice(0, -1))
    } else if (current.length < 4) {
      setter(current + digit)
    }
  }

  const handleSubmit = () => {
    setError('')
    if (!displayName.trim()) { setError('Nama anak harus diisi'); return }
    if (!username.trim() || username.length < 3) { setError('Username minimal 3 karakter'); return }
    if (!/^[a-z0-9_]+$/.test(username)) { setError('Username hanya boleh huruf kecil, angka, dan underscore'); return }
    if (pin.length !== 4) { setError('PIN harus 4 digit'); return }
    if (pin !== confirmPin) { setError('Konfirmasi PIN tidak cocok'); return }
    mutation.mutate()
  }

  return (
    <div className="min-h-screen bg-wkl-background pb-10">
      <header className="bg-wkl-surface-lowest border-b border-wkl-outline-variant flex items-center gap-3 px-4 py-4 sticky top-0 z-50">
        <Link href="/parent/dashboard" className="text-wkl-on-surface-variant hover:text-wkl-on-surface">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </Link>
        <h1 className="text-xl font-bold text-wkl-on-surface">Tambah Anak</h1>
      </header>

      <main className="px-4 py-6 md:max-w-md md:mx-auto space-y-6">
        {/* Avatar picker */}
        <section className="bg-wkl-surface-lowest border border-wkl-outline-variant rounded-xl p-4">
          <p className="text-sm font-semibold text-wkl-on-surface-variant mb-3">Pilih Avatar</p>
          <div className="grid grid-cols-4 gap-3">
            {AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => setAvatar(av)}
                className={`text-3xl h-16 rounded-xl border-2 transition-all ${
                  avatar === av
                    ? 'border-wkl-primary-container bg-wkl-surface-container scale-105'
                    : 'border-wkl-outline-variant bg-wkl-surface-low hover:border-wkl-secondary'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </section>

        {/* Name */}
        <section className="bg-wkl-surface-lowest border border-wkl-outline-variant rounded-xl p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-wkl-on-surface-variant">Nama Panggilan</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="contoh: Dika"
              className="w-full border-2 border-wkl-outline-variant rounded-lg px-4 py-3 text-wkl-on-surface placeholder-wkl-on-surface-variant/50 focus:border-wkl-secondary focus:outline-none bg-wkl-surface-lowest text-base"
              maxLength={30}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-wkl-on-surface-variant">Username Login</label>
            <p className="text-xs text-wkl-on-surface-variant">Huruf kecil, angka, underscore. Dipakai anak untuk login.</p>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="contoh: dika123"
                className="w-full border-2 border-wkl-outline-variant rounded-lg px-4 py-3 text-wkl-on-surface placeholder-wkl-on-surface-variant/50 focus:border-wkl-secondary focus:outline-none bg-wkl-surface-lowest text-base font-mono"
                maxLength={30}
              />
            </div>
          </div>
        </section>

        {/* Grade level */}
        <section className="bg-wkl-surface-lowest border border-wkl-outline-variant rounded-xl p-4">
          <p className="text-sm font-semibold text-wkl-on-surface-variant mb-3">Kelas</p>
          <div className="flex gap-3">
            {[1, 2, 3].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGradeLevel(g)}
                className={`flex-1 py-3 rounded-xl border-2 font-bold text-lg transition-all ${
                  gradeLevel === g
                    ? 'border-wkl-primary-container bg-wkl-primary-container text-white'
                    : 'border-wkl-outline-variant bg-wkl-surface-low text-wkl-on-surface-variant hover:border-wkl-secondary'
                }`}
              >
                Kelas {g}
              </button>
            ))}
          </div>
        </section>

        {/* PIN setup */}
        <section className="bg-wkl-surface-lowest border border-wkl-outline-variant rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold text-wkl-on-surface-variant">PIN Login Anak (4 digit)</p>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-wkl-on-surface-variant mb-2">PIN Baru</p>
              <div className="flex gap-3 justify-center">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-colors ${
                      pin[i]
                        ? 'border-wkl-primary-container bg-wkl-surface-container text-wkl-on-surface'
                        : 'border-wkl-outline-variant bg-wkl-surface-low text-transparent'
                    }`}
                  >
                    {pin[i] ? '●' : '○'}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-wkl-on-surface-variant mb-2">Konfirmasi PIN</p>
              <div className="flex gap-3 justify-center">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-colors ${
                      confirmPin[i]
                        ? pin[i] === confirmPin[i]
                          ? 'border-green-400 bg-green-50 text-green-600'
                          : 'border-wkl-error bg-wkl-error-container text-wkl-error'
                        : 'border-wkl-outline-variant bg-wkl-surface-low'
                    }`}
                  >
                    {confirmPin[i] ? '●' : '○'}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Numpad — field aktif: pin dulu, lalu confirm */}
          <PinPad
            onInput={(d) => {
              if (pin.length < 4) handlePinInput(d, 'pin')
              else handlePinInput(d, 'confirm')
            }}
            onDelete={() => {
              if (confirmPin.length > 0) handlePinInput('del', 'confirm')
              else handlePinInput('del', 'pin')
            }}
          />
        </section>

        {error && (
          <p className="text-wkl-error text-sm font-medium text-center bg-wkl-error-container px-4 py-3 rounded-xl">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="w-full bg-wkl-primary-container text-white font-bold text-lg py-4 rounded-xl disabled:opacity-50 transition-opacity shadow-sm"
        >
          {mutation.isPending ? 'Menyimpan...' : `Tambahkan ${avatar} ${displayName || 'Anak'}`}
        </button>
      </main>
    </div>
  )
}

function PinPad({ onInput, onDelete }: { onInput: (d: string) => void; onDelete: () => void }) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']
  return (
    <div className="grid grid-cols-3 gap-2 mt-2">
      {digits.map((d, i) =>
        d === '' ? (
          <div key={i} />
        ) : d === 'del' ? (
          <button
            key={i}
            type="button"
            onClick={onDelete}
            className="h-12 rounded-xl bg-wkl-surface-variant text-wkl-on-surface flex items-center justify-center active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">backspace</span>
          </button>
        ) : (
          <button
            key={i}
            type="button"
            onClick={() => onInput(d)}
            className="h-12 rounded-xl bg-wkl-surface-container hover:bg-wkl-surface-container-high font-bold text-xl text-wkl-on-surface active:scale-95 transition-all"
          >
            {d}
          </button>
        )
      )}
    </div>
  )
}
