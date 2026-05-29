'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { admin } from '@/lib/api'
import Link from 'next/link'

export default function AdminVideosPage() {
  const qc = useQueryClient()
  const { data: videos, isLoading } = useQuery({
    queryKey: ['admin-videos'],
    queryFn: admin.listVideos,
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

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/dashboard" className="text-gray-400 text-sm">← Back</Link>
        <h1 className="text-xl font-bold text-gray-900">Video Global</h1>
      </div>

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
