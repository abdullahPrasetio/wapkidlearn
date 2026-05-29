'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/api'
import { setStoredRole } from '@/lib/auth'

const PIN_LENGTH = 4

export default function ChildLoginPage() {
  const router = useRouter()
  const [childId, setChildId] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'parent' | 'pin'>('parent')

  const handlePinDigit = (digit: string) => {
    if (pin.length >= PIN_LENGTH) return
    const next = pin + digit
    setPin(next)
    if (next.length === PIN_LENGTH) {
      handlePinSubmit(next)
    }
  }

  const handlePinSubmit = async (pinValue: string) => {
    setError('')
    setLoading(true)
    try {
      await auth.childLogin(childId, pinValue)
      setStoredRole('child')
      router.replace('/child/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PIN salah')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'parent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-400 to-blue-600 px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-2">👦</div>
            <h1 className="text-2xl font-bold text-gray-900">Halo Adik!</h1>
            <p className="text-gray-500 text-sm mt-1">Masukkan ID Anak kamu dulu ya</p>
          </div>
          <input
            type="text"
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="ID Anak"
          />
          <button
            onClick={() => setStep('pin')}
            disabled={!childId}
            className="mt-4 w-full bg-blue-500 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            Lanjut
          </button>
          <div className="mt-4 text-center">
            <a href="/login" className="text-blue-500 text-sm hover:underline">← Login Orang Tua</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-400 to-blue-600 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🔑</div>
          <h1 className="text-2xl font-bold text-gray-900">Masukkan PIN</h1>
          <p className="text-gray-500 text-sm mt-1">PIN 4 angka kamu</p>
        </div>

        {/* PIN display */}
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition ${
                i < pin.length
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              {i < pin.length ? '●' : ''}
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <button
              key={i}
              onClick={() => {
                if (d === '⌫') setPin((p) => p.slice(0, -1))
                else if (d) handlePinDigit(d)
              }}
              disabled={loading || !d && d !== '0'}
              className={`h-14 rounded-xl text-xl font-bold transition ${
                d === '⌫'
                  ? 'bg-red-50 text-red-500 hover:bg-red-100'
                  : d
                  ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:scale-95'
                  : ''
              } disabled:opacity-50`}
            >
              {d}
            </button>
          ))}
        </div>

        <button
          onClick={() => { setStep('parent'); setPin(''); setChildId('') }}
          className="mt-4 w-full text-blue-500 text-sm"
        >
          ← Ganti ID Orang Tua
        </button>
      </div>
    </div>
  )
}
