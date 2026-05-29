'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { admin } from '@/lib/api'
import Link from 'next/link'
import { useState } from 'react'

export default function AdminVideosPage() {
  const qc = useQueryClient()
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
    },
    onError: (err: any) => alert(err.message || 'Gagal menambah video'),
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

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newVideo.title || !newVideo.url) return
    addMut.mutate({ ...newVideo, scope: 'global' })
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/dashboard" className="text-gray-400 text-sm">← Back</Link>
        <h1 className="text-xl font-bold text-gray-900">Video Global</h1>
      </div>

      {/* Form Tambah Video */}
      <form onSubmit={handleAdd} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Tambah Video Baru</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Judul Video"
            value={newVideo.title}
            onChange={e => setNewVideo({ ...newVideo, title: e.target.value })}
            className="text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="url"
            placeholder="URL YouTube/Vimeo"
            value={newVideo.url}
            onChange={e => setNewVideo({ ...newVideo, url: e.target.value })}
            className="text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={addMut.isPending}
          className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {addMut.isPending ? 'Menambah...' : 'Tambah Video'}
        </button>
      </form>

      {isLoading && <p className="text-gray-400 text-sm text-center py-8">Memuat...</p>}

      <div className="space-y-3">
        {videos?.map(v => (
          <div key={v.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl shrink-0">
                {v.video_type === 'youtube' ? '▶️' : '🎬'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[v.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {v.status}
                  </span>
                  <span className="text-xs text-gray-400">{v.scope}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{v.title}</p>
                <p className="text-xs text-gray-400 truncate">{v.url}</p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {v.status === 'pending' && (
                  <>
                    <button
                      onClick={() => approveMut.mutate(v.id)}
                      disabled={approveMut.isPending}
                      className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg font-medium disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Alasan penolakan:')
                        if (reason !== null) rejectMut.mutate({ id: v.id, reason })
                      }}
                      className="text-xs bg-red-400 text-white px-3 py-1 rounded-lg font-medium"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => { if (confirm('Hapus video ini?')) deleteMut.mutate(v.id) }}
                  className="text-xs text-red-400 font-medium text-right"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
        {videos?.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">Belum ada video.</p>
        )}
      </div>
    </div>
  )
}
