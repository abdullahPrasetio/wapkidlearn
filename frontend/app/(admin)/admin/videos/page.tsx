'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { admin } from '@/lib/api'
import { useState } from 'react'
import type { VideoStatus, Video } from '@/lib/types'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

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

function VideoThumbnail({ video }: { video: Video }) {
  return (
    <div className={`aspect-video bg-wkl-surface-variant flex items-center justify-center overflow-hidden ${video.status === 'rejected' ? 'opacity-70 grayscale-[30%]' : ''}`}>
      {video.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
      ) : (
        <span className="material-symbols-outlined text-wkl-on-surface-variant text-5xl">play_circle</span>
      )}
    </div>
  )
}

export default function AdminVideosPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('pending')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newVideo, setNewVideo] = useState({ title: '', url: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editUrl, setEditUrl] = useState('')

  const handleTabChange = (t: Tab) => {
    setTab(t)
    window.history.replaceState(null, '', `?tab=${t}`)
  }

  const { data: videos } = useQuery({
    queryKey: ['admin-videos'],
    queryFn: admin.listVideos,
  })

  const addMut = useMutation({
    mutationFn: (data: { title: string; url: string; scope: string }) => admin.addVideo(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-videos'] })
      setNewVideo({ title: '', url: '' })
      setShowForm(false)
      handleTabChange('pending')
    },
    onError: (err: unknown) => alert((err as Error).message || 'Gagal menambah video'),
  })

  const editMut = useMutation({
    mutationFn: ({ id, title, url }: { id: string; title: string; url: string }) =>
      admin.editVideo(id, { title, url }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-videos'] })
      setEditingId(null)
    },
    onError: (err: unknown) => alert((err as Error).message || 'Gagal mengedit video'),
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
  const promoteGlobalMut = useMutation({
    mutationFn: admin.promoteVideoGlobal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-videos'] }),
    onError: (err: unknown) => alert((err as Error).message || 'Gagal promote ke global'),
  })

  const filtered = (videos ?? [])
    .filter((v) => v.status === tab)
    .filter((v) => !search || v.title.toLowerCase().includes(search.toLowerCase()))

  const startEdit = (v: Video) => {
    setEditingId(v.id)
    setEditTitle(v.title)
    setEditUrl(v.url)
  }

  return (
    <div className="flex bg-wkl-background min-h-screen">
      <AdminSidebar />

      <div className="flex-1 md:ml-60 flex flex-col min-h-screen pb-24 md:pb-0">
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
              Tambah Video Global
            </button>
          </div>

          {showForm && (
            <div className="bg-wkl-surface-lowest border border-wkl-outline-variant rounded-xl p-5 mb-6 space-y-4">
              <h2 className="font-semibold text-wkl-on-surface">Tambah Video Global Baru</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text" placeholder="Judul Video" value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  className="text-sm border-2 border-wkl-outline-variant rounded px-3 py-2 outline-none focus:border-wkl-secondary bg-wkl-surface"
                />
                <input
                  type="url" placeholder="URL YouTube/Vimeo" value={newVideo.url}
                  onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                  className="text-sm border-2 border-wkl-outline-variant rounded px-3 py-2 outline-none focus:border-wkl-secondary bg-wkl-surface"
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

          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-wkl-on-surface-variant text-[20px]">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari video berdasarkan judul..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-wkl-outline-variant bg-wkl-surface text-sm focus:outline-none focus:border-wkl-primary"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-wkl-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          <div className="flex gap-1 mb-5 bg-wkl-surface-container rounded-xl p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  tab === t.key ? 'bg-wkl-surface text-wkl-primary shadow-sm' : 'text-wkl-on-surface-variant'
                }`}
              >
                {t.label}
                {videos && (
                  <span className="ml-1.5 text-xs opacity-60">({videos.filter((v) => v.status === t.key).length})</span>
                )}
              </button>
            ))}
          </div>

          {!videos ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-wkl-surface-lowest border border-wkl-surface-variant rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-wkl-on-surface-variant">
              <p className="text-4xl mb-3">🎬</p>
              <p className="font-medium">{search ? `Tidak ada video untuk "${search}"` : `Tidak ada video ${TABS.find((t) => t.key === tab)?.label.toLowerCase()}`}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((v) => {
                const badge = STATUS_BADGE[v.status]
                const isEditing = editingId === v.id
                return (
                  <div key={v.id} className={`bg-wkl-surface-lowest rounded-xl border overflow-hidden flex flex-col hover:shadow-md transition-shadow ${v.status === 'rejected' ? 'border-wkl-error-container' : 'border-wkl-surface-variant'}`}>
                    <VideoThumbnail video={v} />
                    <div className={`p-4 flex-1 flex flex-col gap-2 ${v.status === 'rejected' ? 'bg-wkl-error-container/10' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="w-full border border-wkl-outline-variant rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-wkl-primary bg-wkl-surface"
                            placeholder="Judul"
                          />
                          <input
                            value={editUrl}
                            onChange={e => setEditUrl(e.target.value)}
                            className="w-full border border-wkl-outline-variant rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-wkl-primary bg-wkl-surface"
                            placeholder="URL YouTube/Vimeo"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 border border-wkl-outline-variant rounded-lg text-xs">Batal</button>
                            <button
                              onClick={() => editMut.mutate({ id: v.id, title: editTitle, url: editUrl })}
                              disabled={editMut.isPending}
                              className="flex-1 py-1.5 bg-wkl-primary text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                            >
                              {editMut.isPending ? '...' : 'Simpan'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm text-wkl-on-background leading-tight line-clamp-2 flex-1">{v.title}</h3>
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => startEdit(v)} className="p-1 rounded hover:bg-wkl-surface-container text-wkl-on-surface-variant">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                onClick={() => { if (confirm('Hapus video ini?')) deleteMut.mutate(v.id) }}
                                disabled={deleteMut.isPending}
                                className="p-1 rounded hover:bg-red-50 text-wkl-on-surface-variant hover:text-red-500"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-xs text-wkl-on-surface-variant">
                              {v.url?.includes('youtube') ? 'YouTube' : v.url?.includes('vimeo') ? 'Vimeo' : 'MP4'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
                          </div>

                          {v.status === 'pending' && (
                            <div className="flex gap-2 mt-1">
                              <button
                                onClick={() => approveMut.mutate(v.id)}
                                disabled={approveMut.isPending}
                                className="flex-1 bg-green-500 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-green-600 disabled:opacity-50"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Alasan penolakan:')
                                  if (reason !== null) rejectMut.mutate({ id: v.id, reason: reason || 'Tidak memenuhi standar' })
                                }}
                                disabled={rejectMut.isPending}
                                className="flex-1 bg-wkl-surface-variant text-wkl-on-surface text-xs font-bold py-1.5 rounded-lg hover:bg-wkl-surface-high disabled:opacity-50"
                              >
                                ✕ Tolak
                              </button>
                            </div>
                          )}
                          {v.status === 'active' && v.scope !== 'global' && (
                            <button
                              onClick={() => {
                                if (confirm('Jadikan video ini global? Semua anak akan bisa mengaksesnya.'))
                                  promoteGlobalMut.mutate(v.id)
                              }}
                              disabled={promoteGlobalMut.isPending}
                              className="w-full mt-1 bg-blue-500 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                            >
                              🌐 Jadikan Global
                            </button>
                          )}
                          {v.status === 'active' && v.scope === 'global' && (
                            <div className="mt-1 text-center text-xs font-bold text-blue-600 py-1.5 bg-blue-50 rounded-lg">
                              🌐 Video Global
                            </div>
                          )}
                          {v.status === 'rejected' && (
                            <button
                              onClick={() => approveMut.mutate(v.id)}
                              disabled={approveMut.isPending}
                              className="w-full mt-1 bg-green-500 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-green-600 disabled:opacity-50"
                            >
                              ✓ Approve Sekarang
                            </button>
                          )}
                        </>
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
