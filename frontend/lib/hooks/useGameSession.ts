'use client'

import { useState, useCallback } from 'react'
import { game } from '@/lib/api'
import type { Question, AnswerResult, SessionSummary } from '@/lib/types'

type Phase = 'idle' | 'playing' | 'answered' | 'ended'

export function useGameSession() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [question, setQuestion] = useState<Question | null>(null)
  const [lastAnswer, setLastAnswer] = useState<AnswerResult | null>(null)
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const start = useCallback(async () => {
    try {
      const session = await game.startSession()
      setSessionId(session.id)
      const q = await game.getQuestion(session.id)
      setQuestion(q)
      setPhase('playing')
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memulai game')
    }
  }, [])

  const submitAnswer = useCallback(async (
    answer: string,
    timeTakenSeconds: number
  ) => {
    if (!sessionId || !question) return
    try {
      const result = await game.submitAnswer(sessionId, {
        question_id: question.question_id,
        submitted_answer: answer,
        time_taken_seconds: timeTakenSeconds,
        nonce: question.nonce,
      })
      setLastAnswer(result)
      setPhase('answered')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengirim jawaban')
    }
  }, [sessionId, question])

  const nextQuestion = useCallback(async () => {
    if (!sessionId) return
    try {
      const q = await game.getQuestion(sessionId)
      setQuestion(q)
      setLastAnswer(null)
      setPhase('playing')
    } catch {
      await game.endSession(sessionId).catch(() => {})
      const s = await game.getSessionSummary(sessionId).catch(() => null)
      if (s) setSummary(s)
      setPhase('ended')
    }
  }, [sessionId])

  const endSession = useCallback(async () => {
    if (!sessionId) return
    try {
      await game.endSession(sessionId)
      const s = await game.getSessionSummary(sessionId)
      setSummary(s)
      setPhase('ended')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengakhiri sesi')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  return { phase, question, lastAnswer, summary, error, start, submitAnswer, nextQuestion, endSession }
}
