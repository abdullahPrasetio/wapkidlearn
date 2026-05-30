'use client'

import { useGameSession } from '@/lib/hooks/useGameSession'
import { QuestionCard } from '@/components/game/QuestionCard'
import { SessionSummaryCard } from '@/components/game/SessionSummaryCard'
import Link from 'next/link'

export default function GamePage() {
  const { phase, question, lastAnswer, summary, error, start, submitAnswer, nextQuestion, endSession } = useGameSession()

  if (phase === 'idle') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 font-nunito">
        <div className="text-center space-y-5 w-full max-w-xs">
          <div className="w-28 h-28 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto text-6xl shadow-sm">
            🧮
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Siap Belajar?</h1>
            <p className="text-gray-500 mt-1 text-sm">Jawab soal matematika, kumpulkan poin!</p>
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 font-medium">
              {error}
            </div>
          )}
          <button
            onClick={start}
            className="w-full bg-orange-500 text-white font-extrabold text-lg py-4 rounded-2xl shadow-lg hover:bg-orange-600 active:scale-95 transition"
          >
            Mulai!
          </button>
          <Link href="/child/home" className="block text-gray-400 text-sm">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    )
  }

  if (phase === 'ended' && summary) {
    return <SessionSummaryCard summary={summary} onPlayAgain={start} />
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-2">⏳</div>
          <p className="text-gray-400 text-sm">Memuat soal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-nunito">
      {/* Game header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <button
          onClick={endSession}
          className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2.5} className="w-4 h-4">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-base font-extrabold text-orange-500">
          Soal {question.difficulty} / 10
        </span>
        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2} className="w-4 h-4">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        </div>
      </div>

      <QuestionCard
        question={question}
        lastAnswer={lastAnswer}
        phase={phase}
        onSubmit={submitAnswer}
        onNext={nextQuestion}
        onEnd={endSession}
      />
    </div>
  )
}
