'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { points } from '@/lib/api'

export default function LockedPage() {
  const router = useRouter()

  const { data, isError } = useQuery({
    queryKey: ['wallet'],
    queryFn: points.getWallet,
    refetchInterval: 10_000,
  })

  useEffect(() => {
    if (data && !data.is_locked) {
      router.replace('/child/home')
    }
    if (isError) {
      router.replace('/child-login')
    }
  }, [data, isError, router])

  return (
    <div className="min-h-screen bg-orange-500 flex flex-col items-center justify-between py-12 px-6 font-nunito">
      {/* Top shield icon */}
      <div>
        <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10 opacity-40">
          <path
            d="M24 4L6 12v14c0 10.5 7.6 20.3 18 22.6C34.4 46.3 42 36.5 42 26V12L24 4z"
            stroke="white" strokeWidth={2.5} strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="text-8xl">🔒</div>
        <div>
          <h1 className="text-white font-extrabold text-3xl mb-2">Layar Dikunci</h1>
          <p className="text-white/80 text-base font-medium">
            Orang tua kamu mengunci layar ini
          </p>
        </div>
      </div>

      {/* Waiting indicator */}
      <div className="w-full max-w-xs">
        <div className="bg-white/20 rounded-full px-5 py-3 flex items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <span className="text-white/80 text-sm font-medium">
            Menunggu orang tua membuka...
          </span>
        </div>
      </div>
    </div>
  )
}
