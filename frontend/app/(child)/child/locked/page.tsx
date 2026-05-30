'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { points } from '@/lib/api'

export default function LockedPage() {
  const router = useRouter()

  const { data } = useQuery({
    queryKey: ['wallet'],
    queryFn: points.getWallet,
    refetchInterval: 10_000,
  })

  useEffect(() => {
    if (data && !data.is_locked) {
      router.replace('/child/home')
    }
  }, [data, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-orange-50">
      <div className="text-8xl mb-6 animate-bounce">🔒</div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Akses Dikunci</h1>
      <p className="text-gray-500 text-base leading-relaxed max-w-xs">
        Orang tuamu sedang mengunci akses sementara.
        <br /><br />
        Hubungi orang tuamu untuk membuka kunci.
      </p>

      <div className="mt-10 flex items-center gap-2 text-xs text-gray-400">
        <span className="inline-block w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
        Menunggu orang tua membuka kunci...
      </div>
    </div>
  )
}
