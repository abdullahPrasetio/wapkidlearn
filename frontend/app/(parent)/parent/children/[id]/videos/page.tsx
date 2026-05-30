'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parent } from '@/lib/api'
import type { VideoStatus } from '@/lib/types'
import { useRouter } from 'next/navigation'

type Tab = 'active' | 'pending' | 'rejected'

const TABS: { key: Tab; label: string; status: VideoStatus }[] = [
  { key: 'active', label: 'Aktif', status: 'active' },
  { key: 'pending', label: 'Menunggu', status: 'pending' },
  { key: 'rejected', label: 'Ditolak', status: 'rejected' },
]

const STATUS_BADGE: Record<VideoStatus, { label: string; className: string }> = {
  active: { label: 'Aktif', className: 'bg-[#DCFCE7] text-[#166534]' },
  pending: { label: 'Menunggu', className: 'bg-[#FEF9C3] text-[#854D0E]' },
  rejected: { label: 'Ditolak', className: 'bg-[#FEE2E2] text-[#991B1B]' },
}

export default function ParentVideoPage({ params }: { params: { id: string } }) {
  const { id: childId } = params
  const router = useRouter()
  const qc = useQueryClient()

  const [tab, setTab] = useState<Tab>('active')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [formError, setFormError] = useState('')

  const { data: videoList, isLoading } = useQuery({
    queryKey: ['parent-videos', childId],
    queryFn: () => parent.listVideos(childId),
  })

  const addMutation = useMutation({
    mutationFn: () => parent.addVideo(childId, { title: title.trim(), url: url.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent-videos', childId] })
      setTitle(''); setUrl(''); setShowForm(false); setFormError('')
      setTab('pending')
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : 'Gagal menambahkan video'),
  })

  const approveMutation = useMutation({
    mutationFn: (videoId: string) => parent.approveVideo(videoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent-videos', childId] }),
  })

  const rejectMutation = useMutation({
    mutationFn: (videoId: string) => parent.rejectVideo(videoId, 'Ditolak oleh orang tua'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent-videos', childId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (videoId: string) => parent.deleteVideo(childId, videoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent-videos', childId] }),
  })

  const filtered = videoList?.filter((v) => v.status === TABS.find((t) => t.key === tab)?.status) ?? []

  return (
    <div className="bg-wkl-background text-wkl-on-background pb-24 md:pb-0">
      <main className="max-w-2xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-wkl-on-background mb-1">Kelola Video</h1>
            <p className="text-wkl-on-surface-variant text-sm">Kelola dan pantau status video pembelajaran yang diunggah.</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setFormError('') }}
            className="bg-wkl-primary-container text-white w-full md:w-auto px-6 py-2 rounded-lg font-semibold h-11 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Tambah Video
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-wkl-surface-lowest border border-wkl-outline-variant rounded-xl p-5 mb-6 space-y-4">
            <h2 className="font-semibold text-wkl-on-surface">Tambah Video Baru</h2>
            <div className="space-y-1">
              <label className="text-xs font-medium text-wkl-on-surface-variant">Judul Video</label>
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="contoh: Belajar Perkalian 1-10"
                className="w-full border-2 border-wkl-outline-variant rounded px-4 py-2.5 text-sm focus:outline-none focus:border-wkl-secondary text-wkl-on-surface"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-wkl-on-surface-variant">URL Video</label>
              <input
                type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full border-2 border-wkl-outline-variant rounded px-4 py-2.5 text-sm focus:outline-none focus:border-wkl-secondary text-wkl-on-surface"
              />
            </div>
            {formError && <p className="text-wkl-error text-sm">{formError}</p>}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border-2 border-wkl-outline-variant rounded-lg text-sm font-medium">Batal</button>
              <button
                onClick={() => { if (!title.trim() || !url.trim()) { setFormError('Judul dan URL wajib diisi'); return } addMutation.mutate() }}
                disabled={addMutation.isPending}
                className="px-4 py-2 bg-wkl-primary-container text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {addMutation.isPending ? 'Menyimpan...' : 'Simpan'}
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
              {videoList && (
                <span className="ml-1.5 text-xs">
                  ({videoList.filter((v) => v.status === t.status).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Video cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 bg-wkl-surface-lowest border border-wkl-surface-variant rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-wkl-on-surface-variant">
            <div className="text-5xl mb-4">📺</div>
            <p className="font-medium">Tidak ada video {TABS.find((t) => t.key === tab)?.label.toLowerCase()}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((video) => {
              const badge = STATUS_BADGE[video.status]
              return (
                <div
                  key={video.id}
                  className={`bg-wkl-surface-lowest rounded-xl border overflow-hidden flex flex-col hover:shadow-md transition-shadow ${
                    video.status === 'rejected' ? 'border-wkl-error-container' : 'border-wkl-surface-variant'
                  }`}
                >
                  {/* Thumbnail placeholder */}
                  <div className={`aspect-video bg-wkl-surface-variant flex items-center justify-center ${video.status === 'rejected' ? 'opacity-70 grayscale-[30%]' : ''}`}>
                    <span className="material-symbols-outlined text-wkl-on-surface-variant text-5xl">play_circle</span>
                  </div>

                  <div className={`p-4 flex-1 flex flex-col justify-between ${video.status === 'rejected' ? 'bg-wkl-error-container/10' : ''}`}>
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="font-semibold text-sm text-wkl-on-background leading-tight line-clamp-2 flex-1">{video.title}</h3>
                        <button
                          onClick={() => { if (confirm(`Hapus "${video.title}"?`)) deleteMutation.mutate(video.id) }}
                          disabled={deleteMutation.isPending}
                          className="text-wkl-on-surface-variant hover:text-wkl-error p-1 rounded-full hover:bg-wkl-error-container shrink-0"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                      {video.status === 'rejected' && (
                        <p className="text-xs text-wkl-error/80 mb-3 line-clamp-2">Resolusi video terlalu rendah atau tidak memenuhi standar.</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-wkl-secondary border border-wkl-secondary-fixed bg-wkl-surface-low px-2 py-1 rounded-full truncate max-w-[120px]">
                        {video.url.includes('youtube') ? 'YouTube' : 'Video'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${badge.className}`}>{badge.label}</span>
                    </div>

                    {/* Approve/Reject for pending */}
                    {video.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => approveMutation.mutate(video.id)}
                          disabled={approveMutation.isPending}
                          className="flex-1 bg-green-500 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(video.id)}
                          disabled={rejectMutation.isPending}
                          className="flex-1 bg-wkl-surface-variant text-wkl-on-surface text-xs font-bold py-2 rounded-lg hover:bg-wkl-surface-highest transition disabled:opacity-50"
                        >
                          ✕ Tolak
                        </button>
                      </div>
                    )}
                    {video.status === 'rejected' && (
                      <button
                        onClick={() => approveMutation.mutate(video.id)}
                        disabled={approveMutation.isPending}
                        className="mt-3 w-full bg-green-500 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                      >
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
  )
}
