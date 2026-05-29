'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useWallet } from '@/lib/hooks/useWallet'

export function ChildLockGuard({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useWallet()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (data?.is_locked && pathname !== '/child/locked') {
      router.replace('/child/locked')
    }
  }, [data?.is_locked, pathname, router])

  if (isLoading) return (
    <div className="min-h-screen flex flex-col gap-4 p-6 pt-12 animate-pulse">
      <div className="h-10 bg-gray-200 rounded-2xl w-2/3" />
      <div className="h-32 bg-gray-200 rounded-2xl" />
      <div className="h-32 bg-gray-200 rounded-2xl" />
      <div className="h-20 bg-gray-200 rounded-2xl w-1/2" />
    </div>
  )
  if (isError) return null
  if (data?.is_locked && pathname !== '/child/locked') return null

  return <>{children}</>
}
