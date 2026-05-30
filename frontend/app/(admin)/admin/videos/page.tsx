'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { admin } from '@/lib/api'
import { useState } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import type { VideoStatus } from '@/lib/types'

type Tab = VideoStatus

const TABS: { key: Tab; label: string }[] = [
  { key: 'active', label: 'Aktif' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'rejected', label: 'Ditolak' },
]

const STATUS_BADGE: Record<VideoStatus, { label: string; className: string }> = {
  active: { label: 'Aktif', className: 'bg-[#DCFCE7] text-[#166534]' },
  pending: { label: 'Menunggu', className: 'bg-[#FEF9C3] text-[#854D0E]' },
  rejected: { label: 'Ditolak', className: 'bg-[#FEE2E2] text-[#991B1B]' },
}

export default function AdminVideosPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('pending')
  const [showForm, setShowForm] = useState(false)
  const [newVideo, setNewVideo] = useState({ title: '', url: '' })

  const { data: videos, isLoading } = useQuery({
    queryKey: ['admin-videos'],
    queryFn: admin.listVideos,
  })

  const addMut = useMutation({
    mutationFn: (data: { title: string; url: string; scope: string }) => admin.addVideo(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-videos'] })
      setNewVideo({ title: '', url: '' })
      setShowForm(false)
      setTab('pending')
    },
    onError: (err: unknown) => alert((err as Error).message || 'Gagal menambah video'),
  })

  const approveMut = useMutation({
    mutationFn: admin.approveVideo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-videos'] }),
  })
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => admin.rejectVideo(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-videos'] }),
  })
  const deleteMut = useMutation({
    mutationFn: admin.deleteVideo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-videos'] }),
  })

  const filtered = videos?.filter((v) => v.status === tab) ?? []

  return (
    <div className="flex bg-wkl-background min-h-screen">
      <AdminSidebar />

      <div className="flex-1 md:ml-60 flex flex-col min-h-screen pb-24 md:pb-0">
        {/* Header */}
        <header className="bg-wkl-surface border-b border-wkl-outline-variant flex justify-between items-center w-full px-6 py-4 sticky z-40 top-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 text-wkl-on-surface-variant hover:opacity-80">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-xl font-bold text-wkl-primary">WapKidLearn</h1>
          </div>
          <span className="material-symbols-outlined text-wkl-on-surface-variant text-2xl">account_circle</span>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8 w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-wkl-on-background mb-1">Kelola Video</h1>
              <p className="text-sm text-wkl-on-surface-variant">Kelola dan pantau status video pembelajaran yang diunggah.</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-wkl-primary-container text-white w-full md:w-auto px-6 py-2 rounded-lg font-semibold h-11 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
            >
              <span className="material-symbols-outlined text-xl font-bold">add</span>
              Tambah Video
            </button>
          </div>

          {/* Add form */}
          {showForm && (
            <div className="bg-wkl-surface-lowest border border-wkl-outline-variant rounded-xl p-5 mb-6 space-y-4">
              <h2 className="font-semibold text-wkl-on-surface">Tambah Video Baru (Global)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text" placeholder="Judul Video" value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  className="text-sm border-2 border-wkl-outline-variant rounded px-3 py-2 outline-none focus:border-wkl-secondary"
                />
                <input
                  type="url" placeholder="URL YouTube/Vimeo" value={newVideo.url}
                  onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                  className="text-sm border-2 border-wkl-outline-variant rounded px-3 py-2 outline-none focus:border-wkl-secondary"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium border-2 border-wkl-outline-variant rounded-lg">Batal</button>
                <button
                  onClick={() => { if (!newVideo.title || !newVideo.url) return; addMut.mutate({ ...newVideo, scope: 'global' }) }}
                  disabled={addMut.isPending}
                  className="px-4 py-2 bg-wkl-primary-container text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {addMut.isPending ? 'Menambah...' : 'Tambah'}
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 border-b border-wkl-surface-variant">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm rounded-t-lg border-b-2 whitespace-nowrap transition-colors ${
                  tab === t.key
                    ? 'border-wkl-primary text-wkl-primary bg-wkl-surface-lowest'
                    : 'border-transparent text-wkl-on-surface-variant hover:bg-wkl-surface-variant'
                }`}
              >
                {t.label}
                {videos && (
                  <span className="ml-1.5 text-xs">({videos.filter((v) => v.status === t.key).length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Video grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 bg-wkl-surface-lowest border border-wkl-surface-variant rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-wkl-on-surface-variant">
              <p className="text-4xl mb-3">🎬</p>
              <p className="font-medium">Tidak ada video {TABS.find((t) => t.key === tab)?.label.toLowerCase()}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((v) => {
                const badge = STATUS_BADGE[v.status]
                return (
                  <div key={v.id} className={`bg-wkl-surface-lowest rounded-xl border overflow-hidden flex flex-col hover:shadow-md transition-shadow ${v.status === 'rejected' ? 'border-wkl-error-container' : 'border-wkl-surface-variant'}`}>
                    {/* Thumbnail */}
                    <div className={`aspect-video bg-wkl-surface-variant flex items-center justify-center relative ${v.status === 'rejected' ? 'opacity-70 grayscale-[30%]' : ''}`}>
                      {v.status === 'pending' && (
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-5xl bg-black/50 rounded-full p-2">pending</span>
                        </div>
                      )}
                      <span className="material-symbols-outlined text-wkl-on-surface-variant text-5xl">play_circle</span>
                    </div>

                    <div className={`p-4 flex-1 flex flex-col justify-between ${v.status === 'rejected' ? 'bg-wkl-error-container/10' : ''}`}>
                      <div>
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h3 className="font-semibold text-sm text-wkl-on-background leading-tight line-clamp-2 flex-1">{v.title}</h3>
                          <button
                            onClick={() => { if (confirm('Hapus video ini?')) deleteMut.mutate(v.id) }}
                            disabled={deleteMut.isPending}
                            className={`p-1 rounded-full shrink-0 ${v.status === 'rejected' ? 'text-wkl-error bg-wkl-error-container hover:bg-wkl-error hover:text-white' : 'text-wkl-on-surface-variant hover:text-wkl-error hover:bg-wkl-error-container'} transition-colors`}
                          >
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                        </div>
                        {v.status === 'rejected' && (
                          <p className="text-xs text-wkl-error/80 mb-3">Tidak memenuhi standar konten. Unggah ulang jika perlu.</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs text-wkl-secondary border border-wkl-secondary-fixed bg-wkl-surface-low px-2 py-1 rounded-full">
                          {v.scope === 'global' ? 'Global' : 'Parent'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${badge.className}`}>{badge.label}</span>
                      </div>

                      {/* Actions */}
                      {v.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => approveMut.mutate(v.id)} disabled={approveMut.isPending} className="flex-1 bg-green-500 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50">
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Alasan penolakan:')
                              if (reason !== null) rejectMut.mutate({ id: v.id, reason })
                            }}
                            disabled={rejectMut.isPending}
                            className="flex-1 bg-wkl-error text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}
                      {v.status === 'rejected' && (
                        <button onClick={() => approveMut.mutate(v.id)} disabled={approveMut.isPending} className="mt-3 w-full bg-green-500 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-600 disabled:opacity-50">
                          ✓ Approve Sekarang
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
