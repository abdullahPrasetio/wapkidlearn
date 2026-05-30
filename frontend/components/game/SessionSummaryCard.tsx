'use client'

import Link from 'next/link'
import { formatPoints } from '@/lib/utils'
import type { SessionSummary } from '@/lib/types'

interface Props {
  summary: SessionSummary
  onPlayAgain: () => void
}

export function SessionSummaryCard({ summary, onPlayAgain }: Props) {
  const accuracy = summary.accuracy_pct
  const circumference = 2 * Math.PI * 48
  const offset = circumference - (accuracy / 100) * circumference

  const title = accuracy >= 90 ? 'Hebat!' : accuracy >= 70 ? 'Bagus!' : 'Ayo Semangat!'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-8 font-nunito">
      <div className="w-full max-w-xs space-y-6">
        {/* Trophy icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-5xl">🏆</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-orange-500">{title}</h1>
            <p className="text-gray-500 text-sm mt-1">Kamu menyelesaikan sesi ini.</p>
          </div>
        </div>

        {/* Circular accuracy */}
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="48" fill="none" stroke="#E5E7EB" strokeWidth="10" />
              <circle
                cx="56" cy="56" r="48"
                fill="none"
                stroke="#22C55E"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-gray-900">{accuracy}%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium mt-2">Akurasi</p>
        </div>

        {/* Stats grid */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth={2} className="w-6 h-6">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="M9 12h6M9 16h4" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{summary.total_questions}</p>
              <p className="text-xs text-gray-500 mt-0.5">Soal</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2} className="w-6 h-6">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-2xl font-extrabold text-green-600">{summary.correct_count}</p>
              <p className="text-xs text-gray-500 mt-0.5">Benar</p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
            <div className="flex justify-center mb-2">
              <span className="text-yellow-500 text-xl">⭐</span>
            </div>
            <p className="text-2xl font-extrabold text-orange-500">+{formatPoints(summary.points_earned)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Poin Exp</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full bg-orange-500 text-white font-extrabold py-4 rounded-2xl text-lg hover:bg-orange-600 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Main Lagi
          </button>
          <Link href="/child/home" className="block text-center text-gray-500 font-bold text-sm py-2">
            Kembali ke Home
          </Link>
        </div>
      </div>
    </div>
  )
}
