import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s | WapKidLearn Admin', default: 'Admin Dashboard' },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 max-w-4xl mx-auto">
      {children}
    </div>
  )
}
