'use client'

import { useWallet } from '@/lib/hooks/useWallet'
import { ConvertSlider } from '@/components/points/ConvertSlider'
import { formatPoints, formatSeconds } from '@/lib/utils'
import Link from 'next/link'

export default function RewardsPage() {
  const { data, isLoading, refetch } = useWallet()

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
