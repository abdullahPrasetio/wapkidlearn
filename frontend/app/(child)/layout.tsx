import type { Metadata } from 'next'
import { ChildLockGuard } from '@/components/child/ChildLockGuard'
import { ChildBottomNav } from '@/components/child/BottomNav'

export const metadata: Metadata = {
  title: { template: '%s | WapKidLearn', default: 'WapKidLearn' },
}

export default function ChildLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white max-w-md mx-auto relative">
      <ChildLockGuard>
        <div className="pb-20">
          {children}
        </div>
        <ChildBottomNav />
      </ChildLockGuard>
    </div>
  )
}
