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

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Timer bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            timePercent > 50 ? 'bg-green-400' : timePercent > 20 ? 'bg-yellow-400' : 'bg-red-400'
          )}
          style={{ width: `${timePercent}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center min-h-[140px] flex items-center justify-center">
        <p className="text-2xl font-bold text-gray-900">{question.question_text}</p>
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
                'p-4 rounded-2xl text-lg font-bold border-2 transition active:scale-95',
                phase === 'answered' && isCorrect
                  ? 'bg-green-100 border-green-500 text-green-700'
                  : phase === 'answered' && isWrong
                  ? 'bg-red-100 border-red-500 text-red-700'
                  : isSelected
                  ? 'bg-orange-100 border-orange-500 text-orange-700'
                  : 'bg-white border-gray-200 text-gray-900 hover:border-orange-300 hover:bg-orange-50',
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
        <div
          className={cn(
            'rounded-2xl p-4 text-center animate-bounce-in',
            lastAnswer.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          )}
        >
          <p className="text-2xl mb-1">{lastAnswer.is_correct ? '🎉' : '😅'}</p>
          <p className={cn('font-bold', lastAnswer.is_correct ? 'text-green-700' : 'text-red-700')}>
            {lastAnswer.is_correct ? `+${lastAnswer.points_earned} poin!` : `Jawaban: ${lastAnswer.correct_answer}`}
          </p>
          {lastAnswer.is_correct && lastAnswer.streak > 1 && (
            <p className="text-xs text-green-500 mt-1">🔥 Streak {lastAnswer.streak}x!</p>
          )}
          <div className="flex gap-3 mt-4">
            <button
              onClick={onNext}
              className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition"
            >
              Soal Berikutnya
            </button>
            <button
              onClick={onEnd}
              className="px-4 py-3 text-gray-400 hover:text-gray-600 text-sm"
            >
              Selesai
            </button>
          </div>
        </div>
      )}

      {!canSubmit && phase === 'playing' && (
        <p className="text-center text-gray-400 text-sm animate-pulse">
          Baca soal dulu yuk... {countdown > 0 ? countdown : ''}
        </p>
      )}
    </div>
  )
}
