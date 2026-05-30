'use client'

import Link from 'next/link'
import { useWallet } from '@/lib/hooks/useWallet'
import { useQuery } from '@tanstack/react-query'
import { achievements as achievementsApi } from '@/lib/api'
import { formatPoints } from '@/lib/utils'

function formatWatchMins(secs: number) {
  const m = Math.floor(secs / 60)
  return `${m} M`
}

export default function ChildHomePage() {
  const { data } = useWallet()
  const { data: achData } = useQuery({
    queryKey: ['achievements'],
    queryFn: achievementsApi.list,
    staleTime: 60_000,
  })

  const unlockedCount = achData?.filter((a) => a.unlocked).length ?? 0

  return (
    <div className="min-h-screen bg-white font-nunito">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-lg">🦉</span>
          </div>
          <span className="font-extrabold text-orange-500 text-base">WapKidLearn</span>
        </div>
        <Link
          href="/child/rewards"
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2} className="w-5 h-5">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Link>
      </div>

      {/* Greeting */}
      <div className="px-5 pt-3 pb-1">
        <h1 className="text-2xl font-extrabold text-gray-900">
          Halo, {data?.display_name ?? '…'}! <span>👋</span>
        </h1>
      </div>

      {/* Wallet cards row */}
      <div className="px-5 pt-3 flex gap-3">
        <div className="flex-1 bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <span className="text-xl">⭐</span>
          </div>
          <div>
            <p className="text-xs text-orange-400 font-semibold">Poin Saya</p>
            <p className="text-lg font-extrabold text-orange-500">
              {!data ? '…' :formatPoints(data?.point.balance ?? 0)}
            </p>
          </div>
        </div>
        <div className="flex-1 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <span className="text-xl">🔥</span>
          </div>
          <div>
            <p className="text-xs text-red-400 font-semibold">Nonton</p>
            <p className="text-lg font-extrabold text-red-500">
              {!data ? '…' :formatWatchMins(data?.watch.balance_seconds ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Streak bar */}
      <div className="mx-5 mt-4 bg-orange-50 border border-orange-100 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-800">
            🔥 Streak {!data ? '…' :data?.current_streak ?? 0} hari!
          </span>
          <span className="text-xs text-orange-500 font-semibold">Terus semangat!</span>
        </div>
        <div className="h-3 bg-orange-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
            style={{
              width: `${Math.min(100, ((data?.current_streak ?? 0) / Math.max(data?.longest_streak ?? 1, 7)) * 100)}%`
            }}
          />
        </div>
      </div>

      {/* Menu cards */}
      <div className="px-5 pt-4 grid grid-cols-2 gap-4 pb-4">
        {/* Belajar - full width, links to learn selection */}
        <Link
          href="/child/learn"
          className="col-span-2 bg-gradient-to-r from-orange-50 to-green-50 border border-orange-100 rounded-3xl p-5 hover:shadow-md transition active:scale-95"
        >
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-2xl">🎮</span>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-2xl">📚</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-gray-900 text-base">Belajar</p>
              <p className="text-xs text-gray-500 mt-0.5">Menghitung atau Membaca</p>
              <span className="inline-block bg-orange-100 text-orange-600 text-xs font-bold px-2.5 py-1 rounded-full mt-1.5">
                Mulai Belajar →
              </span>
            </div>
          </div>
        </Link>

        <Link
          href="/child/watch"
          className="bg-blue-50 border border-blue-100 rounded-3xl p-5 flex flex-col items-center gap-3 hover:shadow-md transition active:scale-95"
        >
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-3xl">▶️</span>
          </div>
          <p className="font-extrabold text-gray-900 text-center text-sm">Nonton Video</p>
          <span className="bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1 rounded-full">
            Hadiah Belajar
          </span>
        </Link>

        <Link
          href="/child/achievements"
          className="bg-yellow-50 border border-yellow-100 rounded-3xl p-5 flex flex-col items-center gap-3 hover:shadow-md transition active:scale-95"
        >
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-3xl">🏆</span>
          </div>
          <p className="font-extrabold text-gray-900 text-center text-sm">Pencapaian</p>
          <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
            {unlockedCount} Lencana
          </span>
        </Link>

        <Link
          href="/child/rewards"
          className="col-span-2 bg-purple-50 border border-purple-100 rounded-3xl p-5 flex flex-col items-center gap-3 hover:shadow-md transition active:scale-95"
        >
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-3xl">🎁</span>
          </div>
          <p className="font-extrabold text-gray-900 text-center text-sm">Tukar Poin</p>
          <span className="bg-purple-100 text-purple-600 text-xs font-bold px-3 py-1 rounded-full">
            Diskon 10%
          </span>
        </Link>
      </div>
    </div>
  )
}
