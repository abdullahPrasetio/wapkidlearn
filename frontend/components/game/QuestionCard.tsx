'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { Question, AnswerResult } from '@/lib/types'

type Phase = 'playing' | 'answered' | 'ended'

interface Props {
  question: Question
  lastAnswer: AnswerResult | null
  phase: Phase
  onSubmit: (answer: string, timeTaken: number) => void
  onNext: () => void
  onEnd: () => void
}

export function QuestionCard({ question, lastAnswer, phase, onSubmit, onNext, onEnd }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [canSubmit, setCanSubmit] = useState(false)
  const [countdown, setCountdown] = useState(2)
  const startTime = useRef(Date.now())

  useEffect(() => {
    setSelected(null)
    setElapsed(0)
    setCanSubmit(false)
    setCountdown(2)
    startTime.current = Date.now()

    const t1 = setTimeout(() => setCountdown(1), 1000)
    const t2 = setTimeout(() => { setCanSubmit(true); setCountdown(0) }, 2000)
    const ticker = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearInterval(ticker)
    }
  }, [question.question_id])

  const timeLeft = Math.max(0, question.time_limit_seconds - elapsed)
  const timePercent = (timeLeft / question.time_limit_seconds) * 100

  const handleSelect = (option: string) => {
    if (!canSubmit || phase === 'answered') return
    setSelected(option)
    const timeTaken = Math.floor((Date.now() - startTime.current) / 1000)
    onSubmit(option, timeTaken)
  }

  const topicLabel = question.topic
    ? question.topic.charAt(0).toUpperCase() + question.topic.slice(1)
    : 'Matematika'

  return (
    <div className="px-5 pt-2 pb-4 space-y-5">
      {/* Timer bars */}
      <div className="space-y-1">
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-1000',
              timePercent > 50 ? 'bg-orange-400' : timePercent > 20 ? 'bg-yellow-400' : 'bg-red-400'
            )}
            style={{ width: `${timePercent}%` }}
          />
        </div>
        <div className="h-1.5 bg-red-100 rounded-full overflow-hidden">
          <div className="h-full bg-red-300 rounded-full" style={{ width: `${timePercent * 0.8}%` }} />
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
            <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth={1.5} />
            <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
          </svg>
          {topicLabel}
        </span>
        {lastAnswer && lastAnswer.streak > 1 && (
          <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1.5 rounded-full">
            🔥 x{lastAnswer.streak}
          </span>
        )}
      </div>

      {/* Question area */}
      <div className="bg-orange-50/60 rounded-3xl min-h-[160px] flex items-center justify-center px-6 py-8">
        <p className="text-3xl font-extrabold text-gray-900 text-center">{question.question_text}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option) => {
          const isSelected = selected === option
          const isCorrect = lastAnswer?.correct_answer === option
          const isWrong = isSelected && !lastAnswer?.is_correct

          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={!canSubmit || phase === 'answered'}
              className={cn(
                'py-5 rounded-2xl text-xl font-extrabold border-2 transition active:scale-95 shadow-sm',
                phase === 'answered' && isCorrect
                  ? 'bg-green-100 border-green-400 text-green-700'
                  : phase === 'answered' && isWrong
                  ? 'bg-red-100 border-red-400 text-red-700'
                  : isSelected
                  ? 'bg-orange-100 border-orange-400 text-orange-700'
                  : 'bg-white border-gray-150 text-gray-900 hover:border-orange-300 hover:bg-orange-50',
                !canSubmit && phase !== 'answered' && 'opacity-60 cursor-not-allowed'
              )}
            >
              {option}
            </button>
          )
        })}
      </div>

      {/* Answer feedback */}
      {phase === 'answered' && lastAnswer && (
        <div className={cn(
          'rounded-2xl p-4 text-center',
          lastAnswer.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        )}>
          <p className="text-2xl mb-1">{lastAnswer.is_correct ? '🎉' : '😅'}</p>
          <p className={cn('font-extrabold text-base', lastAnswer.is_correct ? 'text-green-700' : 'text-red-700')}>
            {lastAnswer.is_correct ? `+${lastAnswer.points_earned} poin!` : `Jawaban: ${lastAnswer.correct_answer}`}
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={onNext}
              className="flex-1 bg-orange-500 text-white font-extrabold py-3 rounded-xl hover:bg-orange-600 transition active:scale-95"
            >
              Soal Berikutnya →
            </button>
            <button
              onClick={onEnd}
              className="px-4 py-3 text-gray-400 hover:text-gray-600 text-sm font-medium"
            >
              Selesai
            </button>
          </div>
        </div>
      )}

      {!canSubmit && phase === 'playing' && (
        <p className="text-center text-gray-400 text-sm animate-pulse">
          Baca soal dulu... {countdown > 0 ? countdown : ''}
        </p>
      )}
    </div>
  )
}
