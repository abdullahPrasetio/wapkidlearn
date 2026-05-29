'use client'

import { useQuery } from '@tanstack/react-query'
import { achievements as api } from '@/lib/api'
import type { Achievement } from '@/lib/types'
import Link from 'next/link'

const BADGE_EMOJI: Record<string, string> = {
  first_step: '👣',
  hot_streak: '🔥',
  diligent: '📅',
  century_points: '💯',
  first_watch: '📺',
}

function AchievementCard({ item }: { item: Achievement }) {
  const emoji = BADGE_EMOJI[item.code ?? ''] ?? '🏅'
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl p-4 border ${
        item.unlocked
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-gray-50 border-gray-200 opacity-50'
      }`}
    >
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 ${
          item.unlocked ? 'bg-yellow-100' : 'bg-gray-200'
        }`}
      >
        {item.unlocked ? emoji : '🔒'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm">{item.title}</p>
        <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>
        {item.unlocked && item.unlocked_at && (
          <p className="text-yellow-600 text-xs mt-1">
            ✓ {new Date(item.unlocked_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>
    </div>
  )
}

export default function AchievementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: api.list,
  })

  const unlocked = data?.filter(a => a.unlocked) ?? []
  const locked = data?.filter(a => !a.unlocked) ?? []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pt-4">
        <Link href="/child/home" className="text-gray-400">←</Link>
        <h1 className="text-xl font-bold text-gray-900">Pencapaianku</h1>
      </div>

      {/* Stats */}
      <div className="bg-yellow-500 text-white rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-yellow-100 text-xs font-medium">Badge Diraih</p>
          <p className="text-3xl font-bold mt-1">{unlocked.length}</p>
        </div>
        <span className="text-5xl">🏆</span>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && unlocked.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Sudah Diraih</p>
          <div className="space-y-2">
            {unlocked.map(item => <AchievementCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {!isLoading && locked.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Belum Diraih</p>
          <div className="space-y-2">
            {locked.map(item => <AchievementCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {!isLoading && data?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-gray-500">Mulai belajar untuk raih badge!</p>
        </div>
      )}
    </div>
  )
}
