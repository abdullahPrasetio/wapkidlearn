'use client'

import { useState, useEffect, useRef } from 'react'
import { formatSeconds } from '@/lib/utils'

interface Props {
  sessionId: string
  videoUrl: string
  videoTitle: string
  videoType: string
  allocatedSeconds: number
  onHeartbeat: (elapsed: number) => Promise<number>
  onTimeExpired: () => void
  onBack: () => void
}

const HEARTBEAT_INTERVAL = 30_000

export function VideoPlayer({
  sessionId,
  videoUrl,
  videoTitle,
  videoType,
  allocatedSeconds,
  onHeartbeat,
  onTimeExpired,
  onBack,
}: Props) {
  const [timeRemaining, setTimeRemaining] = useState(allocatedSeconds)
  const [expired, setExpired] = useState(false)
  const lastHeartbeat = useRef(Date.now())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Countdown every second
    const countdownRef = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) return 0
        return prev - 1
      })
    }, 1000)

    const tick = async () => {
      const elapsed = Math.floor((Date.now() - lastHeartbeat.current) / 1000)
      lastHeartbeat.current = Date.now()
      const remaining = await onHeartbeat(elapsed)
      setTimeRemaining(remaining)
      if (remaining <= 0) {
        setExpired(true)
        onTimeExpired()
      }
    }

    intervalRef.current = setInterval(tick, HEARTBEAT_INTERVAL)

    return () => {
      clearInterval(countdownRef)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (timeRemaining <= 0 && !expired) {
      setExpired(true)
      onTimeExpired()
    }
  }, [timeRemaining, expired, onTimeExpired])

  // Handle tab visibility — reset heartbeat timer when tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) lastHeartbeat.current = Date.now()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-6">
        <div className="text-center text-white space-y-4">
          <div className="text-6xl">⏰</div>
          <h2 className="text-2xl font-bold">Waktu Nonton Habis!</h2>
          <p className="text-gray-300">Yuk main matematika lagi untuk dapat lebih banyak waktu</p>
          <button
            onClick={onBack}
            className="bg-orange-500 text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-orange-600 transition"
          >
            Kembali
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 text-white">
        <button onClick={onBack} className="text-white/70 hover:text-white text-sm">✕ Keluar</button>
        <p className="text-white/60 text-sm truncate max-w-[50%]">{videoTitle}</p>
        <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full text-sm">
          <span>⏱</span>
          <span className={timeRemaining <= 60 ? 'text-red-400 font-bold' : 'text-white'}>
            {formatSeconds(timeRemaining)}
          </span>
        </div>
      </div>

      {/* Video container */}
      <div className="flex-1 relative bg-black">
        {videoUrl ? (
          videoType === 'mp4' ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
              style={{ minHeight: '60vh' }}
            />
          ) : (
            <iframe
              src={videoUrl}
              title={videoTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full"
              style={{ height: 'calc(100vh - 112px)', border: 'none' }}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full min-h-[60vh]">
            <p className="text-white/40 text-sm">Memuat video...</p>
          </div>
        )}
      </div>

      {/* Time warning */}
      {timeRemaining <= 300 && (
        <div className="bg-yellow-500 text-black text-center text-sm font-medium py-2 px-4">
          Waktu tersisa {formatSeconds(timeRemaining)}
        </div>
      )}
    </div>
  )
}
