'use client'

import Link from 'next/link'
import { formatPoints } from '@/lib/utils'
import type { SessionSummary } from '@/lib/types'

interface Props {
  summary: SessionSummary
  onPlayAgain: () => void
}

export function SessionSummaryCard({ summary, onPlayAgain }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6 animate-bounce-in">
        <div className="text-6xl">{summary.accuracy_pct >= 80 ? '🏆' : summary.accuracy_pct >= 50 ? '⭐' : '💪'}</div>
        <h1 className="text-2xl font-bold text-gray-900">Sesi Selesai!</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-500">{formatPoints(summary.points_earned)}</p>
              <p className="text-xs text-gray-500 mt-1">Poin didapat</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">{summary.accuracy_pct}%</p>
              <p className="text-xs text-gray-500 mt-1">Akurasi</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4 text-sm text-gray-600 space-y-1">
            <p>✅ Benar: {summary.correct_count} / {summary.total_questions}</p>
            <p>⏱ Waktu: {Math.floor(summary.duration_seconds / 60)}m {summary.duration_seconds % 60}s</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl text-lg hover:bg-orange-600 transition"
          >
            Main Lagi!
          </button>
          <Link
            href="/child/rewards"
            className="block w-full bg-blue-500 text-white font-bold py-4 rounded-2xl text-lg hover:bg-blue-600 transition"
          >
            Tukar Poin →
          </Link>
          <Link href="/child/home" className="block text-gray-400 text-sm py-2">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
