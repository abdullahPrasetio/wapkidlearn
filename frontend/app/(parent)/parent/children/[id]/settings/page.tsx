'use client'

import { use, useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parent } from '@/lib/api'
import Link from 'next/link'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function ChildSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['settings', id],
    queryFn: () => parent.getSettings(id),
  })

  const [dailyLimit, setDailyLimit] = useState(60)
  const [conversionRate, setConversionRate] = useState(10)
  const [requireStudy, setRequireStudy] = useState(true)
  const [minStudy, setMinStudy] = useState(10)
  const [allowedHours, setAllowedHours] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!data) return
    setDailyLimit(data.daily_watch_limit_minutes ?? 60)
    setConversionRate(data.conversion_rate ?? 10)
    setRequireStudy(data.require_study_first ?? true)
    setMinStudy(data.min_study_minutes ?? 10)
    setAllowedHours(data.allowed_hours ?? {})
  }, [data])

  const allHoursAllowed = Object.keys(allowedHours).length === 0

  function toggleHour(h: number) {
    const key = String(h)
    if (allHoursAllowed) {
      // switch from "all allowed" to "specific hours": enable all except this one
      const next: Record<string, boolean> = {}
      HOURS.forEach(hr => { if (hr !== h) next[String(hr)] = true })
      setAllowedHours(next)
    } else {
      setAllowedHours(prev => {
        const next = { ...prev }
        if (next[key]) {
          delete next[key]
        } else {
          next[key] = true
        }
        // if all 24 hours are selected, reset to {} (= all allowed)
        if (Object.keys(next).length === 24) return {}
        return next
      })
    }
  }

  const mutation = useMutation({
    mutationFn: () =>
      parent.updateSettings(id, {
        daily_watch_limit_minutes: dailyLimit,
        conversion_rate: conversionRate,
        require_study_first: requireStudy,
        min_study_minutes: minStudy,
        allowed_hours: allowedHours,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', id] })
      qc.invalidateQueries({ queryKey: ['children'] })
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 pt-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pt-4">
        <Link href={`/parent/children/${id}`} className="text-gray-400">←</Link>
        <h1 className="text-xl font-bold text-gray-900">Pengaturan Reward</h1>
      </div>

      {/* Daily watch limit */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
        <div className="flex justify-between items-center">
          <p className="font-bold text-gray-900">Batas Nonton Harian</p>
          <span className="text-orange-600 font-bold">{dailyLimit} menit</span>
        </div>
        <input
          type="range" min={10} max={180} step={10} value={dailyLimit}
          onChange={e => setDailyLimit(Number(e.target.value))}
          className="w-full accent-orange-500"
        />
        <p className="text-xs text-gray-400">Maksimum waktu menonton per hari (10–180 menit)</p>
      </div>

      {/* Conversion rate */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
        <div className="flex justify-between items-center">
          <p className="font-bold text-gray-900">Rate Konversi</p>
          <span className="text-blue-600 font-bold">{conversionRate} poin / menit</span>
        </div>
        <input
          type="range" min={5} max={50} step={5} value={conversionRate}
          onChange={e => setConversionRate(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
        <p className="text-xs text-gray-400">Berapa poin yang dibutuhkan untuk 1 menit nonton</p>
      </div>

      {/* Require study first */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900">Wajib Belajar Dulu</p>
            <p className="text-gray-500 text-sm mt-0.5">Anak harus main game sebelum bisa nonton</p>
          </div>
          <button
            onClick={() => setRequireStudy(v => !v)}
            className={`w-12 h-6 rounded-full transition-colors ${requireStudy ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow mx-0.5 transition-transform ${requireStudy ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
        {requireStudy && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <p className="text-sm text-gray-700">Minimum menit belajar</p>
              <span className="text-sm font-bold text-gray-900">{minStudy} menit</span>
            </div>
            <input
              type="range" min={5} max={60} step={5} value={minStudy}
              onChange={e => setMinStudy(Number(e.target.value))}
              className="w-full accent-green-500"
            />
          </div>
        )}
      </div>

      {/* Allowed hours */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
        <div className="flex justify-between items-center">
          <p className="font-bold text-gray-900">Jam yang Diizinkan</p>
          {allHoursAllowed && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Semua jam</span>
          )}
        </div>
        <p className="text-xs text-gray-400">Ketuk jam untuk mengizinkan / melarang akses. Kosong = semua jam diizinkan.</p>
        <div className="grid grid-cols-6 gap-2">
          {HOURS.map(h => {
            const active = allHoursAllowed || allowedHours[String(h)]
            return (
              <button
                key={h}
                onClick={() => toggleHour(h)}
                className={`rounded-xl py-2 text-xs font-bold transition ${
                  active ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {String(h).padStart(2, '0')}
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-base disabled:opacity-50"
      >
        {mutation.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </button>

      {mutation.isSuccess && (
        <p className="text-center text-green-600 text-sm font-medium">Pengaturan berhasil disimpan</p>
      )}
      {mutation.isError && (
        <p className="text-center text-red-500 text-sm">{(mutation.error as Error).message}</p>
      )}
    </div>
  )
}
