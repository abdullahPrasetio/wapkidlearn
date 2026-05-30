'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parent } from '@/lib/api'
import type { VideoStatus, Video } from '@/lib/types'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

function VideoThumbnail({ video, size = 'full' }: { video: Video; size?: 'full' | 'small' }) {
  const cls = size === 'full' ? 'aspect-video' : 'h-16 w-28 flex-shrink-0 rounded-lg overflow-hidden'
  return (
    <div className={`${cls} bg-wkl-surface-variant flex items-center justify-center overflow-hidden rounded-t-xl`}>
      {video.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
      ) : (
        <span className="material-symbols-outlined text-wkl-on-surface-variant text-4xl">play_circle</span>
      )}
    </div>
  )
}

export default function ParentVideoPage({ params }: { params: { id: string } }) {
  const { id: childId } = params
  const router = useRouter()
  const qc = useQueryClient()

  const [tab, setTab] = useState<Tab>('active')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [formError, setFormError] = useState('')

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editUrl, setEditUrl] = useState('')

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

  const editMutation = useMutation({
    mutationFn: ({ id, title, url }: { id: string; title: string; url: string }) =>
      parent.editVideo(id, { title, url }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent-videos', childId] })
      setEditingId(null)
    },
    onError: (e) => alert(e instanceof Error ? e.message : 'Gagal mengedit video'),
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

  const currentStatus = TABS.find((t) => t.key === tab)?.status
  const filtered = (videoList ?? [])
    .filter((v) => v.status === currentStatus)
    .filter((v) => !search || v.title.toLowerCase().includes(search.toLowerCase()))

  const startEdit = (v: Video) => {
    setEditingId(v.id)
    setEditTitle(v.title)
    setEditUrl(v.url)
  }

  return (
    <div className="bg-wkl-background text-wkl-on-background pb-24 md:pb-0">
      <div className="sticky top-0 z-10 bg-wkl-surface border-b border-wkl-outline-variant/30 px-4 h-14 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-wkl-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-wkl-on-surface text-[22px]">arrow_back</span>
        </button>
        <h1 className="text-base font-semibold text-wkl-on-surface flex-1">Kelola Video</h1>
        <Link
          href={`/parent/children/${childId}/assign-videos`}
          className="flex items-center gap-1 bg-wkl-surface-container text-wkl-on-surface px-3 py-1.5 rounded-lg text-sm font-semibold border border-wkl-outline-variant"
        >
          <span className="material-symbols-outlined text-[18px]">video_library</span>
          Katalog
        </Link>
        <button
          onClick={() => { setShowForm(!showForm); setFormError('') }}
          className="flex items-center gap-1 bg-wkl-primary text-white px-3 py-1.5 rounded-lg text-sm font-semibold"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tambah
        </button>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4 md:px-6">

        {/* Add form */}
        {showForm && (
          <div className="bg-wkl-surface-container rounded-2xl p-4 mb-4 space-y-3 border border-wkl-outline-variant/30">
            <h2 className="font-semibold text-wkl-on-surface text-sm">Tambah Video Baru</h2>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul video"
              className="w-full border border-wkl-outline-variant rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-wkl-primary bg-wkl-surface"
            />
            <input
              type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full border border-wkl-outline-variant rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-wkl-primary bg-wkl-surface"
            />
            {formError && <p className="text-red-500 text-xs">{formError}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-wkl-outline-variant rounded-lg text-sm">Batal</button>
              <button
                onClick={() => { if (!title.trim() || !url.trim()) { setFormError('Judul dan URL wajib diisi'); return } addMutation.mutate() }}
                disabled={addMutation.isPending}
                className="px-4 py-2 bg-wkl-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {addMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-wkl-on-surface-variant text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari video..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-wkl-outline-variant bg-wkl-surface text-sm focus:outline-none focus:border-wkl-primary"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-wkl-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-wkl-surface-container rounded-xl p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                tab === t.key ? 'bg-wkl-surface text-wkl-primary shadow-sm' : 'text-wkl-on-surface-variant'
              }`}
            >
              {t.label}
              {videoList && (
                <span className="ml-1 opacity-60">({videoList.filter((v) => v.status === t.status).length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-wkl-surface-container rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-wkl-on-surface-variant">
            <div className="text-5xl mb-4">📺</div>
            <p className="font-medium">{search ? `Tidak ada video untuk "${search}"` : `Tidak ada video ${TABS.find((t) => t.key === tab)?.label.toLowerCase()}`}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((video) => {
              const badge = STATUS_BADGE[video.status]
              const isEditing = editingId === video.id

              return (
                <div key={video.id} className="bg-wkl-surface-lowest rounded-2xl border border-wkl-outline-variant/30 overflow-hidden flex flex-col">
                  <VideoThumbnail video={video} />
                  <div className="p-3 flex-1 flex flex-col gap-2">
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
                          placeholder="URL"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 border border-wkl-outline-variant rounded-lg text-xs">Batal</button>
                          <button
                            onClick={() => editMutation.mutate({ id: video.id, title: editTitle, url: editUrl })}
                            disabled={editMutation.isPending}
                            className="flex-1 py-1.5 bg-wkl-primary text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                          >
                            {editMutation.isPending ? '...' : 'Simpan'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-wkl-on-surface line-clamp-2 flex-1">{video.title}</p>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => startEdit(video)} className="p-1 rounded-lg hover:bg-wkl-surface-container text-wkl-on-surface-variant">
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => { if (confirm(`Hapus "${video.title}"?`)) deleteMutation.mutate(video.id) }}
                              disabled={deleteMutation.isPending}
                              className="p-1 rounded-lg hover:bg-red-50 text-wkl-on-surface-variant hover:text-red-500"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-xs text-wkl-on-surface-variant">
                            {video.url.includes('youtube') ? 'YouTube' : video.url.includes('vimeo') ? 'Vimeo' : 'MP4'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
                        </div>
                        {video.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => approveMutation.mutate(video.id)} disabled={approveMutation.isPending}
                              className="flex-1 bg-green-500 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-green-600 disabled:opacity-50">
                              ✓ Approve
                            </button>
                            <button onClick={() => rejectMutation.mutate(video.id)} disabled={rejectMutation.isPending}
                              className="flex-1 bg-wkl-surface-container text-wkl-on-surface text-xs font-bold py-1.5 rounded-lg hover:bg-wkl-surface-high disabled:opacity-50">
                              ✕ Tolak
                            </button>
                          </div>
                        )}
                        {video.status === 'rejected' && (
                          <button onClick={() => approveMutation.mutate(video.id)} disabled={approveMutation.isPending}
                            className="w-full bg-green-500 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-green-600 disabled:opacity-50">
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
  )
}
