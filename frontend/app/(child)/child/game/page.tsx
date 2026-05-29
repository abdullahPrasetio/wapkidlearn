'use client'

import { useGameSession } from '@/lib/hooks/useGameSession'
import { QuestionCard } from '@/components/game/QuestionCard'
import { SessionSummaryCard } from '@/components/game/SessionSummaryCard'
import Link from 'next/link'

export default function GamePage() {
  const { phase, question, lastAnswer, summary, error, start, submitAnswer, nextQuestion, endSession } = useGameSession()

  if (phase === 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-6">
          <div className="text-7xl">🧮</div>
          <h1 className="text-2xl font-bold text-gray-900">Siap Belajar?</h1>
          <p className="text-gray-500">Jawab soal matematika, kumpulkan poin!</p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={start}
            className="bg-orange-500 text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-lg hover:bg-orange-600 active:scale-95 transition"
          >
            Mulai!
          </button>
          <div>
            <Link href="/child/home" className="text-gray-400 text-sm">← Kembali</Link>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'ended' && summary) {
    return <SessionSummaryCard summary={summary} onPlayAgain={start} />
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce">⏳</div>
          <p className="text-gray-500 mt-2">Memuat soal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 pt-8">
      <div className="flex items-center justify-between mb-6 px-2">
        <button onClick={endSession} className="text-gray-400 text-sm">Selesai</button>
        <span className="text-xs text-gray-400">Level {question.difficulty}</span>
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
