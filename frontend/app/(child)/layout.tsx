import type { Metadata } from 'next'
import { ChildLockGuard } from '@/components/child/ChildLockGuard'

export const metadata: Metadata = {
  title: { template: '%s | WapKidLearn', default: 'WapKidLearn' },
}

export default function ChildLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white max-w-md mx-auto">
      <ChildLockGuard>
        {children}
      </ChildLockGuard>
    </div>
  )
}
