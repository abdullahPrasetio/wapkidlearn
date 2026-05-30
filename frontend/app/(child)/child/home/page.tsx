'use client'

import Link from 'next/link'
import { useWallet } from '@/lib/hooks/useWallet'
import { formatPoints, formatSeconds } from '@/lib/utils'

export default function ChildHomePage() {
  const { data, isLoading, isError } = useWallet()

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <p className="text-5xl mb-4">😵</p>
        <p className="text-gray-700 font-semibold">Gagal memuat data</p>
        <p className="text-gray-400 text-sm mt-1">Periksa koneksi internet kamu</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <p className="text-gray-500 text-sm">Halo! 👋</p>
          <h1 className="text-2xl font-bold text-gray-900">Ayo Belajar!</h1>
        </div>
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
          🦊
        </div>
      </div>

      {/* Wallet cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-500 text-white rounded-2xl p-4">
          <p className="text-orange-100 text-xs font-medium">Poin Kamu</p>
          <p className="text-3xl font-bold mt-1">
            {isLoading ? '...' : formatPoints(data?.point.balance ?? 0)}
          </p>
          <p className="text-orange-200 text-xs mt-1">⭐ poin</p>
        </div>
        <div className="bg-blue-500 text-white rounded-2xl p-4">
          <p className="text-blue-100 text-xs font-medium">Waktu Nonton</p>
          <p className="text-3xl font-bold mt-1">
            {isLoading ? '...' : formatSeconds(data?.watch.balance_seconds ?? 0)}
          </p>
          <p className="text-blue-200 text-xs mt-1">⏱ tersisa</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link
          href="/child/game"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">🧮</div>
            <div>
              <p className="font-bold text-gray-900">Main Matematika</p>
              <p className="text-gray-500 text-sm">Kumpulkan poin!</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </Link>

        <Link
          href="/child/rewards"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">🎁</div>
            <div>
              <p className="font-bold text-gray-900">Tukar Poin</p>
              <p className="text-gray-500 text-sm">Poin → Waktu nonton</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </Link>

        <Link
          href="/child/watch"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">📺</div>
            <div>
              <p className="font-bold text-gray-900">Nonton Video</p>
              <p className="text-gray-500 text-sm">Pakai waktu nonton</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </Link>
      </div>

      {/* Achievements shortcut */}
      <Link
        href="/child/achievements"
        className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-4"
      >
        <span className="text-2xl">🏆</span>
        <div>
          <p className="font-bold text-yellow-800 text-sm">Pencapaian Kamu</p>
          <p className="text-yellow-600 text-xs">Lihat semua badge</p>
        </div>
      </Link>
    </div>
  )
}
