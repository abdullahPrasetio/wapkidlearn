'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parent } from '@/lib/api'
import type { Video, VideoStatus, ChildProfile } from '@/lib/types'

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
    <div className="aspect-video bg-wkl-surface-variant flex items-center justify-center overflow-hidden">
      {video.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
      ) : (
        <span className="material-symbols-outlined text-wkl-on-surface-variant text-5xl">play_circle</span>
      )}
    </div>
  )
}

// ── Assign Modal ──────────────────────────────────────────────────────────────

function AssignModal({
  video,
  childList,
  onClose,
}: {
  video: Video
  childList: ChildProfile[]
  onClose: () => void
}) {
  const qc = useQueryClient()

  const { data: assignedIds, isLoading } = useQuery({
    queryKey: ['video-assignments', video.id],
    queryFn: () => parent.getVideoAssignments(video.id),
  })

  const assignMut = useMutation({
    mutationFn: (childId: string) => parent.assignVideoToChild(video.id, childId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['video-assignments', video.id] }),
    onError: (e) => alert(e instanceof Error ? e.message : 'Gagal assign'),
  })

  const unassignMut = useMutation({
    mutationFn: (childId: string) => parent.unassignVideoFromChild(video.id, childId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['video-assignments', video.id] }),
    onError: (e) => alert(e instanceof Error ? e.message : 'Gagal unassign'),
  })

  const isPending = assignMut.isPending || unassignMut.isPending

  const toggle = (child: ChildProfile) => {
    if (isPending) return
    const assigned = assignedIds?.includes(child.id)
    if (assigned) {
      unassignMut.mutate(child.id)
    } else {
      assignMut.mutate(child.id)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-wkl-surface rounded-2xl w-full max-w-sm pb-safe shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-wkl-outline-variant/30">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-wkl-on-surface-variant mb-0.5">Kelola Assign Anak</p>
            <h2 className="font-semibold text-sm text-wkl-on-surface truncate">{video.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="ml-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-wkl-surface-container text-wkl-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-14 bg-wkl-surface-container rounded-xl animate-pulse" />)}
            </div>
          ) : childList.length === 0 ? (
            <p className="text-sm text-wkl-on-surface-variant text-center py-6">
              Belum ada anak terdaftar
            </p>
          ) : (
            <ul className="space-y-2">
              {childList.map((child) => {
                const isAssigned = assignedIds?.includes(child.id) ?? false
                return (
                  <li key={child.id}>
                    <button
                      onClick={() => toggle(child)}
                      disabled={isPending}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors disabled:opacity-60 ${
                        isAssigned
                          ? 'border-wkl-primary bg-wkl-primary/5'
                          : 'border-wkl-outline-variant hover:bg-wkl-surface-container'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-wkl-surface-container flex items-center justify-center shrink-0 overflow-hidden">
                        {child.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={child.avatar} alt={child.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-[20px] text-wkl-on-surface-variant">face</span>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-sm text-wkl-on-surface truncate">{child.display_name}</p>
                        <p className="text-xs text-wkl-on-surface-variant">Kelas {child.grade_level}</p>
                      </div>
                      {/* Checkbox indicator */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isAssigned ? 'border-wkl-primary bg-wkl-primary' : 'border-wkl-outline-variant'
                      }`}>
                        {isAssigned && (
                          <span className="material-symbols-outlined text-white text-[14px]">check</span>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-wkl-surface-container text-wkl-on-surface text-sm font-semibold"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ParentVideosPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('pending')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [formError, setFormError] = useState('')

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editUrl, setEditUrl] = useState('')

  // Assign modal state
  const [assignVideo, setAssignVideo] = useState<Video | null>(null)

  const { data: myVideos } = useQuery({
    queryKey: ['parent-my-videos'],
    queryFn: parent.listMyVideos,
  })

  const { data: children } = useQuery({
    queryKey: ['parent-children'],
    queryFn: parent.listChildren,
  })

  const addMut = useMutation({
    mutationFn: () =>
      parent.addGlobalVideo({ title: newTitle.trim(), url: newUrl.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent-my-videos'] })
      setNewTitle(''); setNewUrl(''); setShowForm(false); setFormError('')
      setTab('pending')
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : 'Gagal menambahkan video'),
  })

  const editMut = useMutation({
    mutationFn: ({ id, title, url }: { id: string; title: string; url: string }) =>
      parent.editVideo(id, { title, url }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent-my-videos'] })
      setEditingId(null)
    },
    onError: (e) => alert(e instanceof Error ? e.message : 'Gagal mengedit video'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      parent.deleteMyVideo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent-my-videos'] }),
    onError: (e) => alert(e instanceof Error ? e.message : 'Gagal menghapus video'),
  })

  const filtered = (myVideos ?? [])
    .filter((v) => v.status === tab)
    .filter((v) => !search || v.title.toLowerCase().includes(search.toLowerCase()))

  const startEdit = (v: Video) => {
    setEditingId(v.id)
    setEditTitle(v.title)
    setEditUrl(v.url)
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-0 bg-wkl-background">
      <header className="bg-wkl-surface border-b border-wkl-outline-variant/30 px-4 md:px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-base font-semibold text-wkl-on-surface">Kelola Video Saya</h1>
        <button
          onClick={() => { setShowForm(!showForm); setFormError('') }}
          className="flex items-center gap-1.5 bg-wkl-primary text-white px-3 py-1.5 rounded-lg text-sm font-semibold"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tambah Video
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 md:px-6 w-full">
        <p className="text-sm text-wkl-on-surface-variant mb-4">
          Semua video yang pernah Anda tambahkan, lintas semua anak. Video global yang disetujui admin akan terlihat oleh semua anak Anda.
        </p>

        {/* Add form */}
        {showForm && (
          <div className="bg-wkl-surface-container rounded-2xl p-4 mb-5 space-y-3 border border-wkl-outline-variant/30">
            <h2 className="font-semibold text-wkl-on-surface text-sm">Tambah Video Global Baru</h2>
            <p className="text-xs text-wkl-on-surface-variant">Video global akan ditinjau admin dan setelah disetujui akan tersedia untuk semua anak Anda.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Judul video"
                className="border border-wkl-outline-variant rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-wkl-primary bg-wkl-surface"
              />
              <input
                type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="border border-wkl-outline-variant rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-wkl-primary bg-wkl-surface"
              />
            </div>
            {formError && <p className="text-red-500 text-xs">{formError}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-wkl-outline-variant rounded-lg text-sm">Batal</button>
              <button
                onClick={() => {
                  if (!newTitle.trim() || !newUrl.trim()) { setFormError('Judul dan URL wajib diisi'); return }
                  addMut.mutate()
                }}
                disabled={addMut.isPending}
                className="px-4 py-2 bg-wkl-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {addMut.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-wkl-on-surface-variant text-[20px]">search</span>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari video berdasarkan judul..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-wkl-outline-variant bg-wkl-surface text-sm focus:outline-none focus:border-wkl-primary"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-wkl-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-wkl-surface-container rounded-xl p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                tab === t.key ? 'bg-wkl-surface text-wkl-primary shadow-sm' : 'text-wkl-on-surface-variant'
              }`}
            >
              {t.label}
              {myVideos && (
                <span className="ml-1.5 text-xs opacity-60">({myVideos.filter((v) => v.status === t.key).length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        {!myVideos ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-wkl-surface-container rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-wkl-on-surface-variant">
            <p className="text-4xl mb-3">🎬</p>
            <p className="font-medium">
              {search ? `Tidak ada video untuk "${search}"` : `Belum ada video ${TABS.find((t) => t.key === tab)?.label.toLowerCase()}`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((v) => {
              const badge = STATUS_BADGE[v.status]
              const isEditing = editingId === v.id
              return (
                <div key={v.id} className={`bg-wkl-surface-lowest rounded-2xl border overflow-hidden flex flex-col hover:shadow-md transition-shadow ${v.status === 'rejected' ? 'border-wkl-error-container' : 'border-wkl-outline-variant/30'}`}>
                  <VideoThumbnail video={v} />
                  <div className={`p-4 flex-1 flex flex-col gap-2 ${v.status === 'rejected' ? 'bg-wkl-error-container/10' : ''}`}>
                    {isEditing ? (
                      <>
                        <input
                          value={editTitle} onChange={e => setEditTitle(e.target.value)}
                          className="w-full border border-wkl-outline-variant rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-wkl-primary bg-wkl-surface"
                          placeholder="Judul"
                        />
                        <input
                          value={editUrl} onChange={e => setEditUrl(e.target.value)}
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
                            <button onClick={() => startEdit(v)} className="p-1 rounded hover:bg-wkl-surface-container text-wkl-on-surface-variant" title="Edit judul/URL">
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => { if (confirm(`Hapus "${v.title}"?`)) deleteMut.mutate(v.id) }}
                              disabled={deleteMut.isPending}
                              className="p-1 rounded hover:bg-red-50 text-wkl-on-surface-variant hover:text-red-500"
                              title="Hapus video"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>

                        {v.status === 'rejected' && (
                          <p className="text-xs text-wkl-error bg-wkl-error-container/30 rounded-lg px-2 py-1.5">
                            {(v as Video & { rejection_reason?: string }).rejection_reason || 'Tidak memenuhi standar konten'}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-auto pt-1">
                          <span className="text-xs text-wkl-on-surface-variant">
                            {v.url?.includes('youtube') ? 'YouTube' : v.url?.includes('vimeo') ? 'Vimeo' : 'MP4'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
                        </div>

                        {/* Assign button — hanya untuk video aktif */}
                        {v.status === 'active' && (
                          <button
                            onClick={() => setAssignVideo(v)}
                            className="mt-1 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-wkl-outline-variant text-xs font-semibold text-wkl-on-surface hover:bg-wkl-surface-container transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">group</span>
                            Kelola Assign Anak
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

      {/* Assign Modal */}
      {assignVideo && (
        <AssignModal
          video={assignVideo}
          childList={children ?? []}
          onClose={() => setAssignVideo(null)}
        />
      )}
    </div>
  )
}
