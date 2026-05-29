'use client'

import { VideoPlayer } from '@/components/video/VideoPlayer'
import { watchSessions } from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function WatchSessionContent({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const videoUrl = searchParams.get('url') ?? ''
  const videoTitle = searchParams.get('title') ?? ''
  const videoType = searchParams.get('type') ?? 'youtube'
  const allocatedSeconds = parseInt(searchParams.get('secs') ?? '0', 10)

  const handleHeartbeat = async (elapsed: number) => {
    try {
      const result = await watchSessions.heartbeat(sessionId, elapsed)
      return result.remaining_seconds
    } catch {
      return 0
    }
  }

  const handleEnd = async () => {
    await watchSessions.end(sessionId).catch(() => {})
    router.replace('/child/home')
  }

  return (
    <VideoPlayer
      sessionId={sessionId}
      videoUrl={videoUrl}
      videoTitle={videoTitle}
      videoType={videoType}
      allocatedSeconds={allocatedSeconds}
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
