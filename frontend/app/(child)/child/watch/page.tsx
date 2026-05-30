'use client'

import { useQuery } from '@tanstack/react-query'
import { videos, watchSessions } from '@/lib/api'
import { useWallet } from '@/lib/hooks/useWallet'
import { useRouter } from 'next/navigation'
import type { Video } from '@/lib/types'
import Link from 'next/link'

function formatMins(secs: number) {
  const m = Math.floor(secs / 60)
  return `${m} Menit`
}

function VideoCardH({ video, onWatch, disabled }: { video: Video; onWatch: (v: Video) => void; disabled: boolean }) {
  return (
    <button onClick={() => !disabled && onWatch(video)} disabled={disabled} className="w-44 flex-shrink-0 text-left group">
      <div className="relative h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 mb-2">
        {video.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🎬</div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          {disabled ? (
            <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M12 1C8.676 1 6 3.676 6 7v1H4a1 1 0 00-1 1v12a1 1 0 001 1h16a1 1 0 001-1V9a1 1 0 00-1-1h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4z" />
              </svg>
            </div>
          ) : (
            <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow group-hover:scale-110 transition">
              <svg viewBox="0 0 24 24" fill="#F97316" className="w-5 h-5 translate-x-0.5"><path d="M8 5v14l11-7z" /></svg>
            </div>
          )}
        </div>
        {video.duration_seconds ? <div className="absolute bottom-1.5 right-2 bg-black/60 text-white text-xs font-bold px-1.5 py-0.5 rounded">{formatMins(video.duration_seconds)}</div> : null}
      </div>
      <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug">{video.title}</p>
      {disabled && <p className="text-xs text-orange-500 font-semibold mt-0.5">🔒 Butuh poin</p>}
    </button>
  )
}

function VideoCardV({ video, onWatch, disabled, balanceSecs }: { video: Video; onWatch: (v: Video) => void; disabled: boolean; balanceSecs: number }) {
  return (
    <button onClick={() => !disabled && onWatch(video)} disabled={disabled} className="w-full text-left flex gap-3 items-start">
      <div className="relative w-28 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
        {video.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="#F97316" className="w-4 h-4 translate-x-0.5"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
      </div>
      <div className="flex-1 pt-1">
        <p className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug">{video.title}</p>
        <p className="text-xs text-gray-400 mt-1">Tersisa {formatMins(balanceSecs)}</p>
        {disabled && <p className="text-xs text-orange-500 font-semibold mt-1">🔒 Butuh {video.required_points ?? 100} Poin</p>}
      </div>
    </button>
  )
}

function Skeleton() {
  return <div className="animate-pulse bg-gray-200 rounded-2xl h-28 w-44 flex-shrink-0" />
}

export default function WatchLibraryPage() {
  const router = useRouter()
  const { data: videoList, isLoading, isError } = useQuery({
    queryKey: ['videos'],
    queryFn: videos.list,
  })
  const { data: wallet } = useWallet()

  const balanceSecs = wallet?.watch.balance_seconds ?? 0
  const hasBalance = balanceSecs > 0
  const activeVideos = videoList?.filter((v) => v.status === 'active') ?? []

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
    <div className="min-h-screen bg-white font-nunito">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-lg">🦉</span>
          </div>
          <span className="font-extrabold text-orange-500 text-base">WapKidLearn</span>
        </div>
        <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Watch time banner */}
      <div className="mx-5 mb-5 bg-blue-500 rounded-2xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5 flex-shrink-0">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" />
          </svg>
          <span className="font-bold text-sm">
            Waktu kamu: {hasBalance ? formatMins(balanceSecs) : '0 Menit'}
          </span>
        </div>
        <span className="text-white/80 text-xs">Yuk, tonton video seru!</span>
      </div>

      {isError ? (
        <div className="text-center py-20 px-6">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="font-bold text-gray-600">Gagal memuat video</p>
        </div>
      ) : (
        <div className="space-y-6 pb-4">
          {/* Video Baru */}
          <div>
            <div className="px-5 flex items-center justify-between mb-3">
              <h2 className="font-extrabold text-gray-900">Video Baru ✨</h2>
              <button className="text-orange-500 text-xs font-bold">Lihat Semua</button>
            </div>
            <div className="pl-5 flex gap-3 overflow-x-auto pb-1">
              {isLoading
                ? [1, 2, 3].map((i) => <Skeleton key={i} />)
                : activeVideos.length === 0
                ? (
                  <p className="text-gray-400 text-sm py-4 pl-1">Belum ada video tersedia</p>
                )
                : activeVideos.slice(0, 6).map((v) => (
                  <VideoCardH key={v.id} video={v} onWatch={handleWatch} disabled={!hasBalance} />
                ))}
              <div className="w-5 flex-shrink-0" />
            </div>
          </div>

          {/* Lanjutkan Menonton */}
          {activeVideos.length > 0 && (
            <div className="px-5">
              <h2 className="font-extrabold text-gray-900 mb-3">Lanjutkan Menonton 🎬</h2>
              <div className="space-y-4">
                {isLoading
                  ? [1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)
                  : activeVideos.slice(0, 3).map((v) => (
                    <VideoCardV key={v.id} video={v} onWatch={handleWatch} disabled={!hasBalance} balanceSecs={balanceSecs} />
                  ))}
              </div>
            </div>
          )}

          {/* No balance locked CTA */}
          {!hasBalance && !isLoading && activeVideos.length > 0 && (
            <div className="mx-5 bg-orange-500 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Kumpulkan poin untuk nonton!</p>
                  <Link href="/child/rewards" className="text-white/80 text-xs font-semibold">
                    🔒 Butuh 100 Poin →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
