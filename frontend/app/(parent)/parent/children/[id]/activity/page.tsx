'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { parent } from '@/lib/api'
import Link from 'next/link'

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ChildActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data, isLoading } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => parent.getActivityFeed(id),
  })

  const activities = data?.activities ?? []

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 pt-4">
        <Link href={`/parent/children/${id}`} className="text-gray-400">←</Link>
        <h1 className="text-xl font-bold text-gray-900">Aktivitas Terakhir</h1>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-16 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && activities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500 font-medium">Belum ada aktivitas</p>
          <p className="text-gray-400 text-sm mt-1">Aktivitas belajar dan nonton akan muncul di sini</p>
        </div>
      )}

      <div className="space-y-2">
        {activities.map((item, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
              item.type === 'game' ? 'bg-orange-100' : 'bg-blue-100'
            }`}>
              {item.type === 'game' ? '🎮' : '▶️'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{item.title}</p>
              <p className="text-xs text-gray-500">{item.detail}</p>
            </div>
            <p className="text-xs text-gray-400 shrink-0">{formatDate(item.occurred_at)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
