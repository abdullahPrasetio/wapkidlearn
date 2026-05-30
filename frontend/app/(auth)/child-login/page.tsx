'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/api'
import { setStoredRole } from '@/lib/auth'

const PIN_LENGTH = 4

const AVATARS = ['🦊', '🐱', '🐻', '🐼', '🐸', '🦁']

export default function ChildLoginPage() {
  const router = useRouter()
  const [childId, setChildId] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'id' | 'pin'>('id')
  const [selectedAvatar, setSelectedAvatar] = useState(0)

  const handlePinDigit = (digit: string) => {
    if (pin.length >= PIN_LENGTH || loading) return
    const next = pin + digit
    setPin(next)
    if (next.length === PIN_LENGTH) {
      handlePinSubmit(next)
    }
  }

  const handleBackspace = () => {
    setPin((p) => p.slice(0, -1))
  }

  const handlePinSubmit = async (pinValue: string) => {
    setError('')
    setLoading(true)
    try {
      await auth.childLogin(childId, pinValue)
      setStoredRole('child')
      router.replace('/child/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PIN salah, coba lagi')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'id') {
    return (
      <div className="min-h-screen flex flex-col items-center bg-orange-400 px-6 py-8">
        {/* Top right parent login */}
        <div className="w-full flex justify-end mb-4">
          <a
            href="/login"
            className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-white/30 transition"
          >
            Ortu
          </a>
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <span className="text-4xl">🦉</span>
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">WapKidLearn</span>
        </div>

        <h1 className="text-white font-extrabold text-2xl mb-8">Halo! Siapa kamu?</h1>

        {/* Avatar selection */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2 w-full justify-center">
          {AVATARS.map((emoji, i) => (
            <button
              key={i}
              onClick={() => setSelectedAvatar(i)}
              className={`flex flex-col items-center gap-1 flex-shrink-0 transition`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-4 transition ${
                selectedAvatar === i
                  ? 'bg-white border-white shadow-lg scale-110'
                  : 'bg-white/40 border-transparent'
              }`}>
                {emoji}
              </div>
              {selectedAvatar === i && (
                <span className="text-white text-xs font-semibold">Kamu</span>
              )}
            </button>
          ))}
        </div>

        {/* Dots indicator */}
        <div className="flex gap-2 mb-8">
          {AVATARS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                selectedAvatar === i ? 'w-4 h-2 bg-white' : 'w-2 h-2 bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Child ID input */}
        <div className="w-full max-w-xs space-y-3">
          <input
            type="text"
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && childId) setStep('pin') }}
            className="w-full bg-white/20 border-2 border-white/40 text-white placeholder-white/60 rounded-2xl px-4 py-3 text-center text-lg font-bold focus:outline-none focus:border-white"
            placeholder="Masukkan ID kamu"
            autoComplete="off"
          />
          <button
            onClick={() => setStep('pin')}
            disabled={!childId.trim()}
            className="w-full bg-white text-orange-500 font-extrabold py-3.5 rounded-2xl text-lg shadow-lg hover:bg-orange-50 transition disabled:opacity-50 active:scale-95"
          >
            Lanjut →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-orange-400">
      {/* Top */}
      <div className="flex items-center justify-between px-6 pt-8 pb-4">
        <button
          onClick={() => { setStep('id'); setPin('') }}
          className="text-white/80 hover:text-white text-sm font-medium"
        >
          ← Ganti
        </button>
        <span className="text-white font-bold text-base">Masukkan PIN</span>
        <div className="w-12" />
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center py-6">
        <div className="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center text-4xl mb-2">
          {AVATARS[selectedAvatar]}
        </div>
        <span className="text-white font-bold text-lg">{childId}</span>
      </div>

      {/* PIN dots */}
      <div className="flex justify-center gap-4 py-4">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full border-2 transition ${
              i < pin.length
                ? 'bg-white border-white'
                : 'bg-transparent border-white/60'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-white/90 text-sm text-center font-medium mt-1">{error}</p>
      )}

      {/* Numpad — white card */}
      <div className="flex-1 flex flex-col justify-end">
        <div className="bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-lg">
          <div className="grid grid-cols-3 gap-3">
            {['1','2','3','4','5','6','7','8','9'].map((d) => (
              <button
                key={d}
                onClick={() => handlePinDigit(d)}
                disabled={loading}
                className="h-16 rounded-2xl bg-gray-50 text-gray-900 text-2xl font-bold hover:bg-orange-50 hover:text-orange-500 active:scale-95 transition border border-gray-100"
              >
                {d}
              </button>
            ))}
            {/* Backspace */}
            <button
              onClick={handleBackspace}
              disabled={loading}
              className="h-16 rounded-2xl bg-gray-50 text-gray-400 text-xl font-bold hover:bg-red-50 hover:text-red-400 active:scale-95 transition border border-gray-100 flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </button>
            {/* 0 */}
            <button
              onClick={() => handlePinDigit('0')}
              disabled={loading}
              className="h-16 rounded-2xl bg-gray-50 text-gray-900 text-2xl font-bold hover:bg-orange-50 hover:text-orange-500 active:scale-95 transition border border-gray-100"
            >
              0
            </button>
            {/* Confirm */}
            <button
              onClick={() => pin.length === PIN_LENGTH && handlePinSubmit(pin)}
              disabled={loading || pin.length < PIN_LENGTH}
              className="h-16 rounded-2xl bg-orange-500 text-white text-xl font-bold hover:bg-orange-600 active:scale-95 transition disabled:opacity-40 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-7 h-7">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
