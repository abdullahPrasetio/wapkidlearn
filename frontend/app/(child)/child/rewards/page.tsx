'use client'

import { useState } from 'react'
import { useWallet } from '@/lib/hooks/useWallet'
import { useMutation } from '@tanstack/react-query'
import { points, auth } from '@/lib/api'
import { formatPoints } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const PRESETS = [10, 20, 50, 100]

export default function RewardsPage() {
  const router = useRouter()
  const { data, isLoading, isError, refetch } = useWallet()
  const [selected, setSelected] = useState(PRESETS[0])
  const [successMsg, setSuccessMsg] = useState('')

  const logoutMutation = useMutation({
    mutationFn: auth.logout,
    onSettled: () => router.replace('/child-login'),
  })

  const balance = data?.point.balance ?? 0
  const watchBalanceSecs = data?.watch.balance_seconds ?? 0
  const conversionRate = data?.conversion_rate ?? 10
  const watchMinutes = Math.floor(selected / conversionRate)

  const mutation = useMutation({
    mutationFn: () =>
      points.convert({
        points: selected,
        idempotency_key: crypto.randomUUID(),
      }),
    onSuccess: (result) => {
      refetch()
      const addedMins = Math.floor(result.seconds_added / 60)
      setSuccessMsg(`+${addedMins} menit ditambahkan!`)
      setTimeout(() => setSuccessMsg(''), 3000)
    },
  })

  const canConvert = balance >= selected && !mutation.isPending

  return (
    <div className="min-h-screen bg-white font-nunito">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-lg">🦉</span>
          </div>
          <span className="font-extrabold text-orange-500 text-base">WapKidLearn</span>
        </div>
        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2} className="w-5 h-5">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      </div>

      <div className="px-5 pt-2 space-y-6 pb-6">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-orange-500">Tukar Hadiahmu!</h1>
          <p className="text-gray-500 text-sm mt-1">Ubah poin belajarmu jadi waktu main.</p>
        </div>

        {/* Balance cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
            {isLoading ? (
              <div className="h-12 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>
                <div className="text-2xl mb-1">🌑</div>
                <p className="text-2xl font-extrabold text-gray-900">{formatPoints(balance)}</p>
                <p className="text-xs text-gray-500 font-semibold">Poin</p>
              </>
            )}
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
            {isLoading ? (
              <div className="h-12 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>
                <div className="text-2xl mb-1">🕐</div>
                <p className="text-2xl font-extrabold text-blue-500">{Math.floor(watchBalanceSecs / 60)}</p>
                <p className="text-xs text-blue-400 font-semibold">Menit</p>
              </>
            )}
          </div>
        </div>

        {/* Preset selector */}
        <div>
          <p className="font-extrabold text-gray-900 mb-3">Pilih Jumlah Poin</p>
          <div className="flex items-center justify-between bg-gray-100 rounded-2xl p-1">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setSelected(p)}
                className={`flex-1 py-3 rounded-xl text-sm font-extrabold transition ${
                  selected === p
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Conversion preview */}
        <div className="bg-orange-500 rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="bg-white/20 rounded-xl px-4 py-3 text-white text-center flex-1">
            <p className="text-2xl font-extrabold">{selected}</p>
            <p className="text-xs font-semibold opacity-80">poin</p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-6 h-6 flex-shrink-0">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="bg-white rounded-xl px-4 py-3 text-gray-900 text-center flex-1">
            <p className="text-xl font-extrabold">{watchMinutes} menit</p>
            <p className="text-xs text-gray-500 font-semibold">nonton</p>
          </div>
        </div>

        {/* Error / Success */}
        {mutation.isError && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 text-center font-medium">
            {mutation.error instanceof Error ? mutation.error.message : 'Gagal menukar poin'}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 text-green-600 text-sm rounded-xl px-4 py-3 text-center font-medium">
            ✅ {successMsg}
          </div>
        )}

        {/* CTA button */}
        <button
          onClick={() => mutation.mutate()}
          disabled={!canConvert || isLoading || isError}
          className="w-full bg-orange-500 text-white font-extrabold py-4 rounded-2xl text-lg hover:bg-orange-600 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>🎁</span>
              Tukar Sekarang
            </>
          )}
        </button>

        {balance < selected && !isLoading && (
          <p className="text-center text-gray-400 text-sm">
            Poin tidak cukup. Kumpulkan {selected - balance} poin lagi!
          </p>
        )}

        {/* Transaction history link */}
        <Link
          href="/child/rewards/transactions"
          className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2} className="w-4 h-4">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-bold text-sm text-gray-700">Riwayat Transaksi</span>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} className="w-4 h-4">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" />
          </svg>
        </Link>

        {/* Logout */}
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="w-full flex items-center justify-between bg-red-50 border border-red-100 rounded-2xl p-4 hover:bg-red-100 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} className="w-4 h-4">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-bold text-sm text-red-600">
              {logoutMutation.isPending ? 'Keluar...' : 'Keluar Akun'}
            </span>
          </div>
        </button>
      </div>
    </div>
  )
}


