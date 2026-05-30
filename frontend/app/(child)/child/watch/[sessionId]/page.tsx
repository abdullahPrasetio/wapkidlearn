'use client'

import { VideoPlayer } from '@/components/video/VideoPlayer'
import { watchSessions } from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef } from 'react'

function WatchSessionContent({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const videoUrl = searchParams.get('url') ?? ''
  const videoTitle = searchParams.get('title') ?? ''
  const videoType = searchParams.get('type') ?? 'youtube'
  const allocatedSeconds = parseInt(searchParams.get('secs') ?? '0', 10)
  const startAtSeconds = parseInt(searchParams.get('start') ?? '0', 10)

  const handleHeartbeat = async (elapsed: number, positionSeconds: number) => {
    try {
      const result = await watchSessions.heartbeat(sessionId, elapsed, positionSeconds)
      return result.remaining_seconds
    } catch {
      return 0
    }
  }

  const ended = useRef(false)

  const handleEnd = async () => {
    if (ended.current) return
    ended.current = true
    await watchSessions.end(sessionId).catch(() => {})
    router.replace('/child/home')
  }

  useEffect(() => {
    return () => {
      if (!ended.current) {
        watchSessions.end(sessionId).catch(() => {})
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <VideoPlayer
      sessionId={sessionId}
      videoUrl={videoUrl}
      videoTitle={videoTitle}
      videoType={videoType}
      allocatedSeconds={allocatedSeconds}
      startAtSeconds={startAtSeconds}
      onHeartbeat={handleHeartbeat}
      onTimeExpired={handleEnd}
      onBack={handleEnd}
    />
  )
}

export default function WatchSessionPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <WatchSessionContent sessionId={sessionId} />
    </Suspense>
  )
}
