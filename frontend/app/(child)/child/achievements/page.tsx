'use client'

import { useQuery } from '@tanstack/react-query'
import { achievements as api } from '@/lib/api'
import type { Achievement } from '@/lib/types'

const BADGE_EMOJI: Record<string, string> = {
  first_step: '🚀',
  hot_streak: '🔥',
  diligent: '📅',
  century_points: '💯',
  first_watch: '📺',
  perfect_score: '💯',
  fast_thinker: '⚡',
  explorer: '🗺️',
  artist: '🎨',
  master: '👑',
}

const BADGE_COLORS: Record<string, string> = {
  first_step: 'from-red-400 to-orange-300',
  hot_streak: 'from-orange-400 to-yellow-300',
  diligent: 'from-blue-400 to-cyan-300',
  century_points: 'from-purple-400 to-pink-300',
  first_watch: 'from-green-400 to-teal-300',
}

function BadgeCard({ item }: { item: Achievement }) {
  const emoji = BADGE_EMOJI[item.code ?? ''] ?? '🏅'
  const gradient = BADGE_COLORS[item.code ?? ''] ?? 'from-gray-300 to-gray-200'

  if (item.unlocked) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl`}>
          {emoji}
        </div>
        <p className="font-extrabold text-gray-900 text-xs text-center leading-tight">{item.title}</p>
        <p className="text-gray-400 text-xs text-center leading-tight">{item.description}</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2">
      <div className="w-14 h-14 rounded-2xl bg-gray-200 flex items-center justify-center text-2xl grayscale opacity-50">
        🔒
      </div>
      <p className="font-extrabold text-gray-400 text-xs text-center leading-tight">{item.title}</p>
      <p className="text-gray-300 text-xs text-center leading-tight">{item.description}</p>
    </div>
  )
}

export default function AchievementsPage() {
  const { data, isError } = useQuery({
    queryKey: ['achievements'],
    queryFn: api.list,
  })

  const unlocked = data?.filter((a) => a.unlocked) ?? []
  const locked = data?.filter((a) => !a.unlocked) ?? []

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
          <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2} className="w-4 h-4">
            <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="px-5 pb-6 space-y-5">
        {/* Banner */}
        {!!data && unlocked.length > 0 && (
          <div className="bg-yellow-400 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/30 rounded-xl flex items-center justify-center text-xl">
                🏆
              </div>
              <div>
                <p className="text-gray-900 font-extrabold text-sm">
                  {unlocked.length} Badge Diraih
                </p>
                <p className="text-gray-700 text-xs">Kamu hebat, teruskan!</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2.5} className="w-5 h-5">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-gray-500 font-medium">Gagal memuat pencapaian</p>
          </div>
        )}

        {/* Loading skeleton */}
        {!data && (
          <div>
            <div className="h-5 bg-gray-200 rounded w-32 mb-3 animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* Unlocked section */}
        {!!data && unlocked.length > 0 && (
          <div>
            <p className="text-sm font-extrabold text-gray-700 mb-3">✨ Koleksi Kamu</p>
            <div className="grid grid-cols-2 gap-3">
              {unlocked.map((item) => (
                <BadgeCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Locked section */}
        {!!data && locked.length > 0 && (
          <div>
            <p className="text-sm font-extrabold text-gray-400 mb-3 flex items-center gap-2">
              <span>🔒</span> Belum Dibuka
            </p>
            <div className="grid grid-cols-2 gap-3">
              {locked.map((item) => (
                <BadgeCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!!data && data?.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🎯</p>
            <p className="text-gray-500 font-bold">Mulai belajar untuk raih badge!</p>
            <p className="text-gray-400 text-sm mt-1">Main game dan selesaikan misi</p>
          </div>
        )}
      </div>
    </div>
  )
}
