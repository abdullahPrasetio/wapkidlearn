'use client'

import { use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parent } from '@/lib/api'
import Link from 'next/link'

export default function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const qc = useQueryClient()

  const { data: children, isLoading } = useQuery({ queryKey: ['children'], queryFn: parent.listChildren })
  const child = children?.find((c) => c.id === id)

  const lockMutation = useMutation({
    mutationFn: () => child?.is_locked ? parent.unlock(id) : parent.lock(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['children'] }),
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 pt-10">
        <div className="h-8 bg-gray-200 rounded-xl w-1/3 animate-pulse" />
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!child) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-gray-700 font-semibold">Anak tidak ditemukan</p>
        <Link href="/parent/dashboard" className="mt-4 text-orange-500 text-sm font-medium">
          ← Kembali ke Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pt-4">
        <Link href="/parent/dashboard" className="text-gray-400">←</Link>
        <h1 className="text-xl font-bold text-gray-900">{child.display_name}</h1>
      </div>

      {/* Emergency lock */}
      <div className={`rounded-2xl p-5 border-2 ${child.is_locked ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900">{child.is_locked ? '🔒 Akses Terkunci' : '✅ Akses Normal'}</p>
            <p className="text-sm text-gray-500 mt-1">
              {child.is_locked ? 'Anak tidak bisa akses saat ini' : 'Anak bisa main dan nonton'}
            </p>
          </div>
          <button
            onClick={() => lockMutation.mutate()}
            disabled={lockMutation.isPending}
            className={`font-bold px-4 py-2 rounded-xl text-sm transition ${
              child.is_locked
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-red-500 text-white hover:bg-red-600'
            } disabled:opacity-50`}
          >
            {lockMutation.isPending ? '...' : child.is_locked ? 'Buka Kunci' : 'Kunci Sekarang'}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-3">
        <Link
          href={`/parent/children/${id}/settings`}
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">⚙️</span>
            <div>
              <p className="font-bold text-gray-900">Pengaturan Reward</p>
              <p className="text-gray-500 text-sm">Rate konversi, batas nonton, jam</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </Link>

        <Link
          href={`/parent/children/${id}/videos`}
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📺</span>
            <div>
              <p className="font-bold text-gray-900">Kelola Video</p>
              <p className="text-gray-500 text-sm">Tambah & approve video</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </Link>

        <Link
          href={`/parent/children/${id}/analytics`}
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <div>
              <p className="font-bold text-gray-900">Laporan</p>
              <p className="text-gray-500 text-sm">Poin, nonton, akurasi</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </Link>

        <Link
          href={`/parent/children/${id}/activity`}
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <div>
              <p className="font-bold text-gray-900">Aktivitas Terakhir</p>
              <p className="text-gray-500 text-sm">Riwayat belajar dan nonton</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </Link>
      </div>
    </div>
  )
}
