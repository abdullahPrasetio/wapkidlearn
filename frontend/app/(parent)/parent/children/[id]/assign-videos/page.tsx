'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parent } from '@/lib/api'
import { useRouter } from 'next/navigation'
import type { Video } from '@/lib/types'

function VideoCard({ video, childId, onAssigned }: { video: Video; childId: string; onAssigned: () => void }) {
  const assignMut = useMutation({
    mutationFn: () =>
      parent.addVideo(childId, { title: video.title, url: video.url }),
    onSuccess: onAssigned,
    onError: (e) => alert(e instanceof Error ? e.message : 'Gagal menambahkan video'),
  })

  return (
    <div className="bg-wkl-surface-lowest rounded-2xl border border-wkl-outline-variant/30 overflow-hidden flex flex-col">
      <div className="aspect-video bg-wkl-surface-variant flex items-center justify-center overflow-hidden">
        {video.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-wkl-on-surface-variant text-5xl">play_circle</span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col gap-2">
        <p className="font-semibold text-sm text-wkl-on-surface line-clamp-2">{video.title}</p>
        <p className="text-xs text-wkl-on-surface-variant">
          {video.url?.includes('youtube') ? 'YouTube' : video.url?.includes('vimeo') ? 'Vimeo' : 'MP4'}
        </p>
        <button
          onClick={() => assignMut.mutate()}
          disabled={assignMut.isPending || assignMut.isSuccess}
          className={`mt-auto w-full py-2 rounded-xl text-xs font-bold transition-colors ${
            assignMut.isSuccess
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-wkl-primary text-white hover:opacity-90 disabled:opacity-50'
          }`}
        >
          {assignMut.isSuccess ? '✓ Ditambahkan' : assignMut.isPending ? 'Menambahkan...' : '+ Tambah ke Anak'}
        </button>
      </div>
    </div>
  )
}

export default function AssignVideosPage({ params }: { params: { id: string } }) {
  const { id: childId } = params
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: globalVideos, isError } = useQuery({
    queryKey: ['global-videos'],
    queryFn: parent.listGlobalVideos,
  })

  const onAssigned = () => {
    qc.invalidateQueries({ queryKey: ['parent-videos', childId] })
  }

  const filtered = (globalVideos ?? []).filter(
    (v) => !search || v.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-wkl-background text-wkl-on-background pb-24 md:pb-0 min-h-screen">
      <div className="sticky top-0 z-10 bg-wkl-surface border-b border-wkl-outline-variant/30 px-4 h-14 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-wkl-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-wkl-on-surface text-[22px]">arrow_back</span>
        </button>
        <h1 className="text-base font-semibold text-wkl-on-surface flex-1">Katalog Video Global</h1>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4 md:px-6">
        <p className="text-sm text-wkl-on-surface-variant mb-4">
          Pilih video dari katalog global untuk ditambahkan ke daftar video anak.
        </p>

        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-wkl-on-surface-variant text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari video..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-wkl-outline-variant bg-wkl-surface text-sm focus:outline-none focus:border-wkl-primary"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-wkl-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {!globalVideos ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-52 bg-wkl-surface-container rounded-2xl animate-pulse" />)}
          </div>
        ) : isError ? (
          <div className="text-center py-16 text-wkl-on-surface-variant">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="font-medium">Gagal memuat katalog video</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-wkl-on-surface-variant">
            <div className="text-5xl mb-4">🎬</div>
            <p className="font-medium">
              {search ? `Tidak ada video untuk "${search}"` : 'Belum ada video global tersedia'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((v) => (
              <VideoCard key={v.id} video={v} childId={childId} onAssigned={onAssigned} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
