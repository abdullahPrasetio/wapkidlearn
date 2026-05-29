'use client'

import { useQuery } from '@tanstack/react-query'
import { videos, watchSessions } from '@/lib/api'
import { useRouter } from 'next/navigation'
import type { Video } from '@/lib/types'
import Link from 'next/link'

export default function WatchLibraryPage() {
  const router = useRouter()
  const { data, isLoading } = useQuery({
    queryKey: ['videos'],
    queryFn: videos.list,
  })

  const handleWatch = async (video: Video) => {
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

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      ) : !data?.length ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📺</div>
          <p>Belum ada video tersedia</p>
          <p className="text-sm mt-1">Tanya Orang Tua untuk menambahkan video</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {data.filter(v => v.status === 'active').map((video) => (
            <button
              key={video.id}
              onClick={() => handleWatch(video)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-left hover:shadow-md transition active:scale-95"
            >
              <div className="bg-gray-100 h-24 flex items-center justify-center text-3xl">
                {video.video_type === 'youtube' ? '▶️' : video.video_type === 'mp4' ? '🎬' : '🎥'}
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
