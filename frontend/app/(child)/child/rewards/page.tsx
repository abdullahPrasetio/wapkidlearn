'use client'

import { useWallet } from '@/lib/hooks/useWallet'
import { ConvertSlider } from '@/components/points/ConvertSlider'
import { formatPoints, formatSeconds } from '@/lib/utils'
import Link from 'next/link'

export default function RewardsPage() {
  const { data, isLoading, isError, refetch } = useWallet()

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 pt-10">
        <div className="h-8 bg-gray-200 rounded-xl w-1/2 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
        <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    )
  }

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
      <div className="flex items-center gap-3 pt-4">
        <Link href="/child/home" className="text-gray-400">←</Link>
        <h1 className="text-xl font-bold text-gray-900">Tukar Poin</h1>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
          <p className="text-xs text-orange-500 font-medium">Poin Kamu</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {isLoading ? '...' : formatPoints(data?.point.balance ?? 0)}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <p className="text-xs text-blue-500 font-medium">Waktu Tersisa</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {isLoading ? '...' : formatSeconds(data?.watch.balance_seconds ?? 0)}
          </p>
        </div>
      </div>

      {!isLoading && data && (
        <ConvertSlider
          balance={data.point.balance}
          watchBalanceSeconds={data.watch.balance_seconds}
          usedTodaySeconds={data.watch.used_today_seconds}
          onConverted={refetch}
        />
      )}

      {/* Transaction link */}
      <Link
        href="/child/rewards/transactions"
        className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
      >
        <span className="text-sm font-medium text-gray-700">📋 Riwayat Transaksi</span>
        <span className="text-gray-400">→</span>
      </Link>
    </div>
  )
}
