'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parent } from '@/lib/api'
import Link from 'next/link'

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function BarChart({ data, color }: { data: { value: number; label: string }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end justify-between h-40 gap-1 border-b border-wkl-surface-variant pb-1">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group">
          <div
            className="w-full max-w-[24px] rounded-t-sm transition-all duration-300"
            style={{ height: `${Math.round((d.value / max) * 100)}%`, background: color, minHeight: d.value > 0 ? '4px' : '0' }}
          />
          <span className="text-[10px] text-wkl-on-surface-variant mt-2">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function ChildAnalyticsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['analytics', id],
    queryFn: () => parent.getAnalytics(id),
  })

  const [delta, setDelta] = useState<string>('')
  const [reason, setReason] = useState('')
  const [adjustResult, setAdjustResult] = useState<string | null>(null)

  const adjustMut = useMutation({
    mutationFn: () => parent.adjustPoints(id, parseInt(delta, 10), reason),
    onSuccess: (res) => {
      const sign = res.delta >= 0 ? '+' : ''
      setAdjustResult(`Berhasil: ${res.old_balance} → ${res.new_balance} poin (${sign}${res.delta})`)
      setDelta('')
      setReason('')
      qc.invalidateQueries({ queryKey: ['analytics', id] })
    },
    onError: (e) => setAdjustResult(`Gagal: ${e instanceof Error ? e.message : 'error tidak diketahui'}`),
  })

  const parsedDelta = parseInt(delta, 10)
  const canAdjust = !isNaN(parsedDelta) && parsedDelta !== 0 && !adjustMut.isPending

  const pointsData = data?.points_per_day?.slice(-7).map((d, i) => ({
    value: d.points,
    label: DAYS[i % 7],
  })) ?? DAYS.map((label) => ({ value: 0, label }))

  const watchData = data?.watch_time_per_day?.slice(-7).map((d, i) => ({
    value: d.minutes,
    label: DAYS[i % 7],
  })) ?? DAYS.map((label) => ({ value: 0, label }))

  const totalPoints = data?.points_per_day?.reduce((s, d) => s + d.points, 0) ?? 0
  const avgWatch = watchData.length ? Math.round(watchData.reduce((s, d) => s + d.value, 0) / watchData.length) : 0

  return (
    <div className="bg-wkl-background text-wkl-on-surface pb-16 md:pb-0">
      <main className="max-w-2xl mx-auto px-4 md:px-0 mt-4">
        {/* Section header */}
        <div className="py-6">
          <h1 className="text-2xl font-bold text-wkl-on-surface">Analitik</h1>
          <p className="text-sm text-wkl-on-surface-variant mt-1">Ringkasan performa belajar minggu ini</p>
        </div>

        {!data ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-wkl-surface-lowest border border-wkl-outline-variant rounded-lg h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Streak cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-wkl-outline-variant rounded-lg p-4 bg-wkl-surface-lowest flex items-center gap-4">
                <div className="text-3xl">🔥</div>
                <div>
                  <p className="text-xs text-wkl-on-surface-variant">Current Streak</p>
                  <p className="text-xl font-bold text-wkl-on-surface">{data?.current_streak ?? 0} Hari</p>
                </div>
              </div>
              <div className="border border-wkl-outline-variant rounded-lg p-4 bg-wkl-surface-lowest flex items-center gap-4">
                <div className="text-3xl">🏅</div>
                <div>
                  <p className="text-xs text-wkl-on-surface-variant">Longest Streak</p>
                  <p className="text-xl font-bold text-wkl-on-surface">{data?.longest_streak ?? 0} Hari</p>
                </div>
              </div>
            </div>

            {/* Points chart */}
            <div className="border border-wkl-outline-variant rounded-lg p-6 bg-wkl-surface-lowest mb-6">
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-base font-semibold text-wkl-on-surface">Poin per Hari</h2>
                <span className="text-xs text-wkl-primary bg-wkl-primary-fixed px-2 py-1 rounded-full">Total: {totalPoints}</span>
              </div>
              <BarChart data={pointsData} color="#f97316" />
            </div>

            {/* Watch time chart */}
            <div className="border border-wkl-outline-variant rounded-lg p-6 bg-wkl-surface-lowest mb-6">
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-base font-semibold text-wkl-on-surface">Waktu Belajar (Menit)</h2>
                <span className="text-xs text-wkl-secondary bg-wkl-secondary-fixed px-2 py-1 rounded-full">Rata-rata: {avgWatch}m</span>
              </div>
              <BarChart data={watchData} color="#0058be" />
            </div>

            {/* Accuracy per topic */}
            {data?.accuracy_per_topic?.length ? (
              <div className="border border-wkl-outline-variant rounded-lg p-6 bg-wkl-surface-lowest mb-8">
                <h2 className="text-base font-semibold text-wkl-on-surface mb-6">Akurasi per Topik</h2>
                <div className="flex flex-col gap-6">
                  {data.accuracy_per_topic.map((t) => {
                    const color = t.accuracy >= 80 ? '#2170e4' : t.accuracy >= 60 ? '#f97316' : '#ba1a1a'
                    return (
                      <div key={t.topic}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-wkl-on-surface font-medium">{t.topic}</span>
                          <span className="text-xs font-semibold" style={{ color }}>{t.accuracy}%</span>
                        </div>
                        <div className="w-full h-3 bg-wkl-surface-variant rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${t.accuracy}%`, background: color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
            {/* Adjust Points */}
            <div className="border border-wkl-outline-variant rounded-lg p-6 bg-wkl-surface-lowest mb-8">
              <h2 className="text-base font-semibold text-wkl-on-surface mb-1">Sesuaikan Poin</h2>
              <p className="text-sm text-wkl-on-surface-variant mb-4">
                Masukkan angka positif untuk tambah poin, negatif untuk kurangi.
                Saldo saat ini: <span className="font-bold text-wkl-on-surface">{data?.current_points ?? 0} poin</span>
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={delta}
                    onChange={(e) => { setDelta(e.target.value); setAdjustResult(null) }}
                    placeholder="cth: -50 atau 100"
                    className="flex-1 border border-wkl-outline-variant rounded-lg px-3 py-2 text-sm bg-wkl-surface focus:outline-none focus:border-wkl-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Alasan (opsional)"
                  className="border border-wkl-outline-variant rounded-lg px-3 py-2 text-sm bg-wkl-surface focus:outline-none focus:border-wkl-primary"
                />
                <button
                  onClick={() => adjustMut.mutate()}
                  disabled={!canAdjust}
                  className="self-start px-5 py-2 bg-wkl-primary-container text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {adjustMut.isPending ? 'Menyimpan...' : 'Terapkan'}
                </button>
                {adjustResult && (
                  <p className={`text-sm font-medium ${adjustResult.startsWith('Berhasil') ? 'text-green-600' : 'text-wkl-error'}`}>
                    {adjustResult}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
