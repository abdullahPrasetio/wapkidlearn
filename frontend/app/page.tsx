'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getStoredRole, getRedirectPath } from '@/lib/auth'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const role = getStoredRole()
    if (role) {
      router.replace(getRedirectPath(role))
    } else {
      router.replace('/login')
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-orange">
      <div className="text-white text-center">
        <div className="text-5xl mb-4">🧮</div>
        <p className="text-xl font-bold">WapKidLearn</p>
      </div>
    </div>
  )
}
