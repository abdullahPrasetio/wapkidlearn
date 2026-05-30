'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { reading } from '@/lib/api'
import { useWallet } from '@/lib/hooks/useWallet'
import type { ReadingPassage } from '@/lib/types'

const difficultyLabel: Record<number, { label: string; color: string }> = {
  1: { label: 'Mudah', color: 'bg-green-100 text-green-700' },
  2: { label: 'Sedang', color: 'bg-yellow-100 text-yellow-700' },
  3: { label: 'Menengah', color: 'bg-orange-100 text-orange-700' },
  4: { label: 'Sulit', color: 'bg-red-100 text-red-700' },
  5: { label: 'Sangat Sulit', color: 'bg-purple-100 text-purple-700' },
  6: { label: 'Mahir', color: 'bg-blue-100 text-blue-700' },
}

function getDifficulty(passage: ReadingPassage) {
  const wc = passage.word_count
  if (wc <= 15) return 1
  if (wc <= 25) return 2
  if (wc <= 40) return 3
  if (wc <= 55) return 4
  if (wc <= 65) return 5
  return 6
}

export default function ReadListPage() {
  const { data: wallet } = useWallet()
  const gradeLevel = wallet?.point ? undefined : undefined
  const [grade, setGrade] = useState(1)

  useEffect(() => {
    // once wallet loads, set default grade
    if (wallet) {
      // wallet doesn't expose grade_level; default 1 until user selects
    }
  }, [wallet])

  const { data: passages, isLoading } = useQuery({
    queryKey: ['reading-passages', grade],
    queryFn: () => reading.getPassages(grade),
    staleTime: 60_000,
  })

  return (
    <div className="min-h-screen bg-white font-nunito pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Link href="/child/home" className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2.5} className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Baca Cerita</h1>
          <p className="text-xs text-gray-400">Latihan membaca &amp; rekam suaramu</p>
        </div>
      </div>

      {/* Grade selector */}
      <div className="px-5 mb-5">
        <p className="text-xs font-bold text-gray-500 mb-2">Pilih Kelas</p>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map((g) => (
            <button
              key={g}
              onClick={() => setGrade(g)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition ${
                grade === g
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Kelas {g}
            </button>
          ))}
        </div>
      </div>

      {/* Passages list */}
      <div className="px-5 space-y-3">
        {isLoading && (
          <div className="text-center py-10 text-gray-400 text-sm">Memuat cerita…</div>
        )}
        {passages?.map((passage) => {
          const diff = getDifficulty(passage)
          const { label, color } = difficultyLabel[diff] ?? difficultyLabel[1]
          return (
            <Link
              key={passage.id}
              href={`/child/read/${passage.id}`}
              className="block bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md active:scale-95 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📖</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-gray-900 text-base leading-tight">{passage.title}</p>
                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">{passage.body}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${color}`}>{label}</span>
                    <span className="text-xs text-gray-400">{passage.word_count} kata</span>
                  </div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={2} className="w-5 h-5 flex-shrink-0 mt-1">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
