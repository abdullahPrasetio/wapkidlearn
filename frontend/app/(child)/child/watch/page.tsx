'use client'

import { useQuery } from '@tanstack/react-query'
import { videos, watchSessions } from '@/lib/api'
import { useWallet } from '@/lib/hooks/useWallet'
import { useRouter } from 'next/navigation'
import type { Video } from '@/lib/types'
import Link from 'next/link'
import { formatSeconds } from '@/lib/utils'

export default function WatchLibraryPage() {
  const router = useRouter()
  const { data: videoList, isLoading } = useQuery({
    queryKey: ['videos'],
    queryFn: videos.list,
  })
  const { data: wallet } = useWallet()

  const balanceSecs = wallet?.watch.balance_seconds ?? 0
  const hasBalance = balanceSecs > 0

  const handleWatch = async (video: Video) => {
    if (!hasBalance) return
    try {
      const session = await watchSessions.start(video.id)
      const params = new URLSearchParams({
        url: session.video_url || video.url,
        title: session.video_title || video.title,
        type: session.video_type || video.video_type || 'youtube',
        secs: String(session.allocated_seconds),
      })
      router.push(`/child/watch/${session.id}?${params.toString()}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Tidak bisa mulai nonton')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pt-4">
        <Link href="/child/home" className="text-gray-400">←</Link>
        <h1 className="text-xl font-bold text-gray-900">Pilih Video</h1>
      </div>

      {/* Watch balance banner */}
      {hasBalance ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm text-blue-700 font-medium">⏱ Sisa waktu nonton</span>
          <span className="text-lg font-bold text-blue-600">{formatSeconds(balanceSecs)}</span>
        </div>
      ) : (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center space-y-2">
          <p className="text-sm font-medium text-orange-700">Waktu nonton habis!</p>
          <p className="text-xs text-orange-500">Main game dulu untuk kumpulkan poin, lalu tukar ke waktu nonton.</p>
          <Link
            href="/child/rewards"
            className="inline-block mt-1 bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            Tukar Poin Sekarang →
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      ) : !videoList?.length ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📺</div>
          <p>Belum ada video tersedia</p>
          <p className="text-sm mt-1">Tanya Orang Tua untuk menambahkan video</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {videoList.filter(v => v.status === 'active').map((video) => (
            <button
              key={video.id}
              onClick={() => handleWatch(video)}
              disabled={!hasBalance}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-left hover:shadow-md transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="relative bg-gray-100 h-24 overflow-hidden">
                {video.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    {video.video_type === 'youtube' ? '▶️' : video.video_type === 'mp4' ? '🎬' : '🎥'}
                  </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <div className="w-9 h-9 bg-white/80 rounded-full flex items-center justify-center shadow">
                    <span className="text-sm pl-0.5">▶</span>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <p className="font-medium text-gray-900 text-sm line-clamp-2">{video.title}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
