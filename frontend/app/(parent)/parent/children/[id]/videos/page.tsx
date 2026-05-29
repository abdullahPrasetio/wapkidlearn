'use client'

import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parent } from '@/lib/api'
import type { VideoStatus } from '@/lib/types'
import Link from 'next/link'

const STATUS_LABEL: Record<VideoStatus, string> = {
  pending: '⏳ Menunggu',
  active: '✅ Aktif',
  rejected: '❌ Ditolak',
}

const STATUS_CLASS: Record<VideoStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  active: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

export default function ParentVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: childId } = use(params)
  const qc = useQueryClient()

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
      setTitle('')
      setUrl('')
      setShowForm(false)
      setFormError('')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!title.trim()) { setFormError('Judul wajib diisi'); return }
    if (!url.trim()) { setFormError('URL wajib diisi'); return }
    addMutation.mutate()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <Link href={`/parent/children/${childId}`} className="text-gray-400">←</Link>
          <h1 className="text-xl font-bold text-gray-900">Kelola Video</h1>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError('') }}
          className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-orange-600 transition"
        >
          {showForm ? 'Batal' : '+ Tambah'}
        </button>
      </div>

      {/* Info: video perlu di-approve dulu */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">📋 Cara kerja video</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-600">
          <li>Tambah URL YouTube / MP4 / Vimeo</li>
          <li>Video masuk status <strong>Menunggu</strong></li>
          <li>Kamu perlu <strong>Approve</strong> agar anak bisa nonton</li>
        </ol>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-900">Tambah Video Baru</h2>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Judul Video</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="contoh: Belajar Perkalian 1-10"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">URL Video</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <p className="text-xs text-gray-400">Mendukung: YouTube, MP4 langsung, Vimeo</p>
          </div>

          {formError && <p className="text-red-500 text-sm">{formError}</p>}

          <button
            type="submit"
            disabled={addMutation.isPending}
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition disabled:opacity-50"
          >
            {addMutation.isPending ? 'Menyimpan...' : 'Simpan Video'}
          </button>
        </form>
      )}

      {/* Video list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : !videoList?.length ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📺</div>
          <p className="font-medium">Belum ada video</p>
          <p className="text-sm mt-1">Tap &quot;+ Tambah&quot; untuk menambahkan video pertama</p>
        </div>
      ) : (
        <div className="space-y-3">
          {videoList.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{video.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{video.url}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-lg border shrink-0 ${STATUS_CLASS[video.status]}`}>
                  {STATUS_LABEL[video.status]}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {video.status === 'pending' && (
                  <>
                    <button
                      onClick={() => approveMutation.mutate(video.id)}
                      disabled={approveMutation.isPending}
                      className="flex-1 bg-green-500 text-white text-sm font-bold py-2 rounded-xl hover:bg-green-600 transition disabled:opacity-50"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(video.id)}
                      disabled={rejectMutation.isPending}
                      className="flex-1 bg-gray-100 text-gray-600 text-sm font-bold py-2 rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
                    >
                      ❌ Tolak
                    </button>
                  </>
                )}
                {video.status === 'rejected' && (
                  <button
                    onClick={() => approveMutation.mutate(video.id)}
                    disabled={approveMutation.isPending}
                    className="flex-1 bg-green-500 text-white text-sm font-bold py-2 rounded-xl hover:bg-green-600 transition disabled:opacity-50"
                  >
                    ✅ Approve Sekarang
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Hapus "${video.title}"?`)) deleteMutation.mutate(video.id)
                  }}
                  disabled={deleteMutation.isPending}
                  className="px-3 py-2 text-red-400 hover:text-red-600 text-sm transition"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
