'use client'

import { useState, useEffect, useRef } from 'react'
import { formatSeconds } from '@/lib/utils'

interface Props {
  sessionId: string
  videoUrl: string
  videoTitle: string
  videoType: string
  allocatedSeconds: number
  startAtSeconds?: number
  onHeartbeat: (elapsed: number, positionSeconds: number) => Promise<number>
  onTimeExpired: () => void
  onBack: () => void
}

const HEARTBEAT_INTERVAL = 10_000

export function VideoPlayer({
  videoUrl,
  videoTitle,
  videoType,
  allocatedSeconds,
  startAtSeconds = 0,
  onHeartbeat,
  onTimeExpired,
  onBack,
}: Props) {
  const [timeRemaining, setTimeRemaining] = useState(allocatedSeconds)
  const [elapsed, setElapsed] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [expired, setExpired] = useState(false)
  const lastHeartbeat = useRef(Date.now())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Untuk iframe (YouTube/Vimeo) kita estimasi posisi dari elapsed + startAt
  const getPosition = () => {
    if (videoType === 'mp4' && videoRef.current) {
      return Math.floor(videoRef.current.currentTime)
    }
    return startAtSeconds + elapsed
  }

  const flushHeartbeat = async () => {
    const e = Math.floor((Date.now() - lastHeartbeat.current) / 1000)
    if (e > 0) {
      lastHeartbeat.current = Date.now()
      await onHeartbeat(e, getPosition()).catch(() => {})
    }
  }

  useEffect(() => {
    const countdownRef = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) return 0
        return prev - 1
      })
      setElapsed((prev) => prev + 1)
    }, 1000)

    const tick = async () => {
      const e = Math.floor((Date.now() - lastHeartbeat.current) / 1000)
      lastHeartbeat.current = Date.now()
      const remaining = await onHeartbeat(e, getPosition())
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
      flushHeartbeat().then(() => onTimeExpired())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, expired])

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) lastHeartbeat.current = Date.now()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Seek mp4 ke posisi resume saat video siap
  const handleVideoLoaded = () => {
    if (videoRef.current && startAtSeconds > 0) {
      videoRef.current.currentTime = startAtSeconds
    }
  }

  const seekVideo = (delta: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + delta)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
        setIsPlaying(true)
      } else {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
  }

  const videoDuration = videoRef.current?.duration || allocatedSeconds
  const progressPercent = videoDuration > 0
    ? Math.min(100, ((videoRef.current?.currentTime ?? elapsed) / videoDuration) * 100)
    : 0

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // Untuk YouTube embed: tambahkan &start=N ke URL
  const resolvedUrl = (() => {
    if (videoType !== 'youtube' || startAtSeconds <= 0) return videoUrl
    try {
      const u = new URL(videoUrl)
      u.searchParams.set('start', String(startAtSeconds))
      return u.toString()
    } catch {
      return videoUrl
    }
  })()

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-6">
        <div className="text-center text-white space-y-4">
          <div className="text-6xl">⏰</div>
          <h2 className="text-2xl font-extrabold">Waktu Nonton Habis!</h2>
          <p className="text-gray-300 text-sm">Yuk main matematika lagi untuk dapat lebih banyak waktu</p>
          <button
            onClick={onBack}
            className="bg-orange-500 text-white font-extrabold px-8 py-4 rounded-2xl text-lg hover:bg-orange-600 transition"
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
      <div className="flex items-center justify-between px-4 py-4">
        <button
          onClick={() => flushHeartbeat().then(onBack)}
          className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-4 h-4">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
        <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" />
          </svg>
          <span className={`text-sm font-bold ${timeRemaining <= 60 ? 'text-red-400' : 'text-white'}`}>
            {formatSeconds(timeRemaining)}
          </span>
        </div>
      </div>

      {/* Title */}
      <p className="text-white/70 text-sm text-center px-6 pb-3">{videoTitle}</p>

      {/* Video */}
      <div className="flex-1 flex items-center bg-black">
        {resolvedUrl ? (
          videoType === 'mp4' ? (
            <video
              ref={videoRef}
              src={resolvedUrl}
              autoPlay
              className="w-full"
              style={{ maxHeight: '50vh' }}
              onLoadedMetadata={handleVideoLoaded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            <iframe
              src={resolvedUrl}
              title={videoTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full"
              style={{ height: '50vh', border: 'none' }}
            />
          )
        ) : (
          <div className="flex items-center justify-center w-full h-40">
            <p className="text-white/30 text-sm">Memuat video...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-6 pb-10 pt-5 bg-black">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-white/50 text-xs font-mono w-10">{formatTime(elapsed)}</span>
          <div className="flex-1 h-1 bg-white/20 rounded-full relative">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${progressPercent}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>
          <span className="text-white/50 text-xs font-mono w-10 text-right">{formatTime(allocatedSeconds)}</span>
        </div>

        {/* Play controls — only meaningful for mp4 */}
        {videoType === 'mp4' && (
          <div className="flex items-center justify-center gap-8 mb-4">
            <button onClick={() => seekVideo(-10)} className="text-white/80 hover:text-white transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
                <polyline points="11 17 6 12 11 7" /><path d="M18 17V7" strokeLinecap="round" />
                <text x="7" y="20" fontSize="6" fill="currentColor">10</text>
              </svg>
            </button>
            <button
              onClick={togglePlay}
              className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition active:scale-95 shadow-lg"
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                  <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 translate-x-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button onClick={() => seekVideo(10)} className="text-white/80 hover:text-white transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
                <polyline points="13 17 18 12 13 7" /><path d="M6 17V7" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Time warning */}
        {timeRemaining <= 300 && (
          <div className="flex items-center justify-center gap-2 bg-yellow-500/20 rounded-xl py-2 px-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
            </svg>
            <span className="text-yellow-400 text-sm font-semibold">Waktu belajar hampir habis!</span>
          </div>
        )}
      </div>
    </div>
  )
}
