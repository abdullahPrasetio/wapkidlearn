'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parent } from '@/lib/api'
import { ParentSettings } from '@/lib/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function Stepper({ value, onChange, min = 0, max = 200, step = 5 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number
}) {
  return (
    <div className="flex items-center gap-2 bg-wkl-surface-variant p-2 rounded-lg w-fit">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-8 h-8 flex items-center justify-center bg-wkl-surface-lowest rounded shadow-sm text-wkl-primary hover:bg-wkl-surface transition-colors"
      >
        <span className="material-symbols-outlined text-xl">remove</span>
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseInt(e.target.value)
          if (!isNaN(v)) onChange(v)
        }}
        className="w-16 bg-transparent text-xl font-bold text-center text-wkl-on-surface focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        className="w-8 h-8 flex items-center justify-center bg-wkl-surface-lowest rounded shadow-sm text-wkl-primary hover:bg-wkl-surface transition-colors"
      >
        <span className="material-symbols-outlined text-xl">add</span>
      </button>
    </div>
  )
}

export default function ChildSettingsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['settings', id],
    queryFn: () => parent.getSettings(id),
  })

  const [dailyLimit, setDailyLimit] = useState(60)
  const [conversionRate, setConversionRate] = useState(10)
  const [allowedHours, setAllowedHours] = useState<Record<string, boolean>>({})
  const [requireStudyFirst, setRequireStudyFirst] = useState(true)
  const [minStudyMinutes, setMinStudyMinutes] = useState(10)
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    if (!data) return
    setDailyLimit(data.daily_watch_limit_minutes ?? 60)
    setConversionRate(data.conversion_rate ?? 10)
    setAllowedHours(data.allowed_hours ?? {})
    setRequireStudyFirst(data.require_study_first ?? true)
    setMinStudyMinutes(data.min_study_minutes ?? 10)
    setIsLocked(data.emergency_lock ?? false)
  }, [data])

  const allHoursAllowed = Object.keys(allowedHours).length === 0

  function toggleHour(h: number) {
    const key = String(h)
    if (allHoursAllowed) {
      const next: Record<string, boolean> = {}
      HOURS.forEach((hr) => { if (hr !== h) next[String(hr)] = true })
      setAllowedHours(next)
    } else {
      setAllowedHours((prev) => {
        const next = { ...prev }
        if (next[key]) delete next[key]
        else next[key] = true
        if (Object.keys(next).length === 24) return {}
        return next
      })
    }
  }

  const mutation = useMutation({
    mutationFn: (vals: Partial<ParentSettings>) => parent.updateSettings(id, vals),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', id] })
      qc.invalidateQueries({ queryKey: ['children'] })
    },
  })

  const lockMutation = useMutation({
    mutationFn: (lock: boolean) => lock ? parent.lock(id) : parent.unlock(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', id] })
      qc.invalidateQueries({ queryKey: ['children'] })
    },
  })

  const handleSave = () => {
    mutation.mutate({
      daily_watch_limit_minutes: dailyLimit,
      conversion_rate: conversionRate,
      allowed_hours: allowedHours,
      require_study_first: requireStudyFirst,
      min_study_minutes: minStudyMinutes,
    })
  }

  const handleToggleLock = (checked: boolean) => {
    setIsLocked(checked)
    lockMutation.mutate(checked)
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-wkl-background">
        <div className="h-14 bg-wkl-surface-lowest border-b border-wkl-outline-variant animate-pulse" />
        <div className="p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-wkl-surface-lowest rounded-xl h-32 border border-wkl-outline-variant animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-wkl-background text-wkl-on-surface pb-24">
      <main className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
        {/* Keamanan */}
        <section className="bg-wkl-surface-lowest rounded-xl border border-wkl-outline-variant p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-wkl-primary text-xl">security</span>
            <h2 className="text-lg font-semibold text-wkl-on-surface">Keamanan</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-wkl-surface-variant transition-colors">
              <div>
                <p className="font-semibold text-wkl-on-surface">Emergency Lock</p>
                <p className="text-wkl-on-surface-variant text-sm">Kunci semua akses anak seketika</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isLocked}
                  onChange={(e) => handleToggleLock(e.target.checked)}
                />
                <div className="w-11 h-6 bg-wkl-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wkl-error" />
              </label>
            </div>
          </div>
        </section>

        {/* Belajar Dulu */}
        <section className="bg-wkl-surface-lowest rounded-xl border border-wkl-outline-variant p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-wkl-primary text-xl">menu_book</span>
            <h2 className="text-lg font-semibold text-wkl-on-surface">Aturan Belajar</h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-wkl-on-surface">Wajib Belajar Dulu</p>
                <p className="text-wkl-on-surface-variant text-sm">Anak harus belajar sebelum bisa menonton</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={requireStudyFirst}
                  onChange={(e) => setRequireStudyFirst(e.target.checked)}
                />
                <div className="w-11 h-6 bg-wkl-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wkl-primary" />
              </label>
            </div>
            {requireStudyFirst && (
              <div>
                <label className="block font-semibold text-wkl-on-surface mb-1">Minimal Belajar (Menit)</label>
                <p className="text-wkl-on-surface-variant text-sm mb-3">Durasi minimal belajar untuk membuka video</p>
                <Stepper value={minStudyMinutes} onChange={setMinStudyMinutes} min={5} max={60} step={5} />
              </div>
            )}
          </div>
        </section>

        {/* Batas Harian */}
        <section className="bg-wkl-surface-lowest rounded-xl border border-wkl-outline-variant p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-wkl-primary text-xl">timer</span>
            <h2 className="text-lg font-semibold text-wkl-on-surface">Batas Harian & Poin</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block font-semibold text-wkl-on-surface mb-1">Batas Menonton Harian (Menit)</label>
              <p className="text-wkl-on-surface-variant text-sm mb-3">Maksimal durasi menonton per hari</p>
              <Stepper value={dailyLimit} onChange={setDailyLimit} min={10} max={240} step={10} />
            </div>
            <div>
              <label className="block font-semibold text-wkl-on-surface mb-1">Nilai Tukar Poin Belajar</label>
              <p className="text-wkl-on-surface-variant text-sm mb-3">Berapa menit didapat dari 100 poin</p>
              <Stepper value={conversionRate} onChange={setConversionRate} min={5} max={100} step={5} />
            </div>
          </div>
        </section>

        {/* Jam Menonton */}
        <section className="bg-wkl-surface-lowest rounded-xl border border-wkl-outline-variant p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-wkl-primary text-xl">schedule</span>
            <h2 className="text-lg font-semibold text-wkl-on-surface">Jam Menonton</h2>
          </div>
          <p className="text-wkl-on-surface-variant text-sm mb-4">Pilih jam dimana anak diperbolehkan menonton</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {HOURS.map((h) => {
              const active = allHoursAllowed || !!allowedHours[String(h)]
              return (
                <label
                  key={h}
                  className={`flex items-center justify-center p-2 border rounded-lg cursor-pointer transition-colors text-xs font-medium select-none ${
                    active
                      ? 'bg-wkl-primary-container text-white border-wkl-primary-container'
                      : 'bg-wkl-surface-lowest text-wkl-on-surface-variant border-wkl-outline-variant hover:bg-wkl-surface-variant'
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={active} onChange={() => toggleHour(h)} />
                  {String(h).padStart(2, '0')}:00
                </label>
              )
            })}
          </div>
        </section>

        {(mutation.isSuccess || lockMutation.isSuccess) && (
          <p className="text-center text-green-600 text-sm font-medium">Pengaturan berhasil disimpan ✓</p>
        )}
        {(mutation.isError || lockMutation.isError) && (
          <p className="text-center text-wkl-error text-sm">{(mutation.error || lockMutation.error as any)?.message}</p>
        )}
      </main>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 w-full bg-wkl-surface-lowest border-t border-wkl-outline-variant p-4 shadow-[0px_-4px_12px_rgba(17,24,39,0.05)] z-20">
        <div className="max-w-3xl mx-auto flex justify-end gap-4">
          <button
            onClick={() => router.back()}
            className="px-8 py-2 h-11 bg-wkl-surface-lowest border-2 border-wkl-outline-variant text-wkl-on-surface rounded-lg font-semibold hover:bg-wkl-surface-variant transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="px-8 py-2 h-11 bg-wkl-primary-container text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
          >
            {mutation.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
    </div>
  )
}
