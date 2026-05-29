import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s | WapKidLearn Orang Tua', default: 'Dashboard Orang Tua' },
}

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      {children}
    </div>
  )
}
