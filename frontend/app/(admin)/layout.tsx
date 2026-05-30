import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s | WapKidLearn Admin', default: 'Admin Dashboard' },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-wkl-background font-sans text-wkl-on-background antialiased">
      {children}
    </div>
  )
}
