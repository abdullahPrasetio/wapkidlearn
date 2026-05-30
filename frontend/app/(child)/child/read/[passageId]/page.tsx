'use client'

import { useCallback, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { reading } from '@/lib/api'
import { formatPoints } from '@/lib/utils'

type Phase = 'idle' | 'countdown' | 'recording' | 'done' | 'submitted'

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function calcAccuracy(original: string, transcript: string): number {
  const origWords = normalize(original).split(' ')
  const pool = [...normalize(transcript).split(' ')]
  if (origWords.length === 0) return 0
  let matched = 0
  for (const word of origWords) {
    const idx = pool.indexOf(word)
    if (idx !== -1) { matched++; pool.splice(idx, 1) }
  }
  return Math.round((matched / origWords.length) * 100)
}

function HighlightedText({ original, transcript }: { original: string; transcript: string }) {
  const rawWords = original.match(/\S+/g) ?? []
  const pool = [...normalize(transcript).split(' ')]
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1 justify-center">
      {rawWords.map((word, i) => {
        const normalized = normalize(word)
        const idx = pool.indexOf(normalized)
        const matched = idx !== -1
        if (matched) pool.splice(idx, 1)
        return (
          <span
            key={i}
            className={`text-2xl font-bold leading-snug ${
              transcript === '' ? 'text-gray-900' : matched ? 'text-green-600' : 'text-red-400'
            }`}
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}

// eslint-disable-next-line
type AnySpeechRecognition = any

declare global {
  interface Window {
    SpeechRecognition: AnySpeechRecognition
    webkitSpeechRecognition: AnySpeechRecognition
  }
}

export default function ReadPracticePage() {
  const { passageId } = useParams<{ passageId: string }>()
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('idle')
  const [countdown, setCountdown] = useState(3)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [accuracy, setAccuracy] = useState(0)
  const [supported] = useState(() =>
    typeof window !== 'undefined' && !!(window.SpeechRecognition ?? window.webkitSpeechRecognition)
  )

  const recognitionRef = useRef<AnySpeechRecognition>(null)
  const startTimeRef = useRef(0)
  const durationRef = useRef(0)

  const { data: passages, isLoading } = useQuery({
    queryKey: ['reading-passages-all'],
    queryFn: async () => {
      const results = await Promise.all([1,2,3,4,5,6].map((g) => reading.getPassages(g)))
      return results.flat()
    },
    staleTime: 300_000,
  })

  const passage = passages?.find((p) => p.id === passageId)

  const submitMutation = useMutation({
    mutationFn: () => reading.submit({
      passage_id: passageId,
      transcript,
      accuracy,
      duration_seconds: durationRef.current,
    }),
    onSuccess: () => setPhase('submitted'),
  })

  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR || !passage) return

    const recognition = new SR()
    recognition.lang = 'id-ID'
    recognition.continuous = true
    recognition.interimResults = true

    let finalTranscript = ''
    recognition.onresult = (event: AnySpeechRecognition) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + ' '
        else interim += event.results[i][0].transcript
      }
      setTranscript(finalTranscript)
      setInterimTranscript(interim)
    }

    const finish = () => {
      durationRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const full = finalTranscript.trim()
      setTranscript(full)
      setInterimTranscript('')
      setAccuracy(calcAccuracy(passage.body, full))
      setPhase('done')
    }

    recognition.onend = finish
    recognition.onerror = (e: AnySpeechRecognition) => { if (e.error !== 'no-speech') finish() }

    recognitionRef.current = recognition
    startTimeRef.current = Date.now()
    recognition.start()
    setPhase('recording')
  }, [passage])

  const stopRecording = useCallback(() => recognitionRef.current?.stop(), [])

  const startCountdown = useCallback(() => {
    setPhase('countdown')
    setCountdown(3)
    setTranscript('')
    setInterimTranscript('')
    let c = 3
    const t = setInterval(() => {
      c--
      setCountdown(c)
      if (c === 0) { clearInterval(t); startRecording() }
    }, 1000)
  }, [startRecording])

  const retry = useCallback(() => {
    setPhase('idle')
    setTranscript('')
    setInterimTranscript('')
    setAccuracy(0)
  }, [])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Memuat cerita…</div>
  }

  if (!passage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-500">Cerita tidak ditemukan.</p>
        <Link href="/child/learn" className="text-green-600 font-bold">← Kembali</Link>
      </div>
    )
  }

  // === SUBMITTED SCREEN ===
  if (phase === 'submitted' && submitMutation.data) {
    const res = submitMutation.data
    const acc = Math.round(res.accuracy)
    const circumference = 2 * Math.PI * 48
    const offset = circumference - (acc / 100) * circumference
    const title = acc >= 90 ? 'Luar Biasa! 🌟' : acc >= 70 ? 'Bagus Sekali! 👏' : acc >= 50 ? 'Terus Berlatih! 💪' : 'Ayo Semangat! 🎯'

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-8 font-nunito">
        <div className="w-full max-w-xs space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-5xl">📚</span>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-green-600">{title}</h1>
              <p className="text-gray-500 text-sm mt-1">Kamu berhasil membaca cerita ini.</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 112 112">
                <circle cx="56" cy="56" r="48" fill="none" stroke="#E5E7EB" strokeWidth="10" />
                <circle cx="56" cy="56" r="48" fill="none" stroke="#22C55E" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-gray-900">{acc}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium mt-2">Akurasi Baca</p>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
            <span className="text-yellow-500 text-xl">⭐</span>
            <p className="text-2xl font-extrabold text-orange-500 mt-1">+{formatPoints(res.points_earned)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Poin Exp</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/child/read')}
              className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl text-lg hover:bg-green-600 active:scale-95 transition"
            >
              Pilih Cerita Lain
            </button>
            <Link href="/child/home" className="block text-center text-gray-400 font-bold text-sm py-2">
              Kembali ke Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // === MAIN PRACTICE SCREEN ===
  const displayTranscript = transcript + (interimTranscript ? ` ${interimTranscript}` : '')

  return (
    <div className="min-h-screen bg-white font-nunito pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={() => router.back()} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2.5} className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-extrabold text-gray-900 leading-tight truncate">{passage.title}</h1>
          <p className="text-xs text-gray-400">Kelas {passage.grade_level} · {passage.word_count} kata</p>
        </div>
        <Link href="/child/home" className="text-xs text-gray-400 font-semibold hover:text-gray-600">
          🏠 Home
        </Link>
      </div>

      {/* Instructions */}
      {phase === 'idle' && (
        <div className="mx-5 mb-4 bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-sm font-bold text-green-800 mb-1">📢 Cara Bermain:</p>
          <ol className="text-xs text-green-700 space-y-0.5 list-decimal list-inside">
            <li>Baca teks di bawah dengan suara keras</li>
            <li>Tekan <strong>Mulai Rekam</strong> saat siap</li>
            <li>Tekan <strong>Stop</strong> setelah selesai membaca</li>
          </ol>
        </div>
      )}

      {!supported && (
        <div className="mx-5 mb-4 bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-red-700">⚠️ Gunakan Chrome atau Edge</p>
          <p className="text-xs text-red-600 mt-0.5">Browser ini tidak mendukung fitur rekam suara.</p>
        </div>
      )}

      {/* Text display */}
      <div className="mx-5 mb-4">
        <div className="bg-orange-50 rounded-3xl px-6 py-8 min-h-[160px] flex items-center justify-center">
          {phase === 'done' ? (
            <HighlightedText original={passage.body} transcript={transcript} />
          ) : (
            <p className="text-2xl font-bold text-gray-900 leading-snug text-center">{passage.body}</p>
          )}
        </div>
        {phase === 'done' && (
          <p className="text-center text-xs text-gray-400 mt-2">
            <span className="text-green-600 font-bold">Hijau</span> = benar ·{' '}
            <span className="text-red-400 font-bold">Merah</span> = terlewat
          </p>
        )}
      </div>

      {/* Transcript box */}
      {(phase === 'recording' || phase === 'done') && (
        <div className="mx-5 mb-4">
          <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Yang kamu ucapkan:</p>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 min-h-[56px]">
            <p className="text-sm text-gray-700 leading-relaxed">
              {displayTranscript || (
                <span className="text-gray-400 italic">
                  {phase === 'recording' ? 'Mendengarkan…' : 'Tidak ada suara terdeteksi'}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Accuracy bar */}
      {phase === 'done' && (
        <div className="mx-5 mb-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-500">Akurasi</p>
            <p className={`text-sm font-extrabold ${accuracy >= 70 ? 'text-green-600' : accuracy >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
              {accuracy}%
            </p>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${accuracy >= 70 ? 'bg-green-400' : accuracy >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-5 space-y-3">
        {phase === 'idle' && supported && (
          <button onClick={startCountdown}
            className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl text-lg hover:bg-green-600 active:scale-95 transition flex items-center justify-center gap-3">
            <span className="text-2xl">🎙️</span> Mulai Rekam
          </button>
        )}

        {phase === 'countdown' && (
          <div className="w-full bg-gray-100 rounded-2xl py-6 flex flex-col items-center gap-1">
            <p className="text-gray-500 text-sm font-bold">Bersiap…</p>
            <p className="text-6xl font-extrabold text-green-500">{countdown}</p>
          </div>
        )}

        {phase === 'recording' && (
          <button onClick={stopRecording}
            className="w-full bg-red-500 text-white font-extrabold py-4 rounded-2xl text-lg hover:bg-red-600 active:scale-95 transition flex items-center justify-center gap-3 animate-pulse">
            <span className="text-2xl">⏹️</span> Stop Rekam
          </button>
        )}

        {phase === 'done' && (
          <>
            <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}
              className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl text-lg hover:bg-green-600 active:scale-95 transition disabled:opacity-60">
              {submitMutation.isPending ? 'Menyimpan…' : 'Selesai & Klaim Poin 🎉'}
            </button>
            <button onClick={retry}
              className="w-full bg-gray-100 text-gray-600 font-extrabold py-3 rounded-2xl text-base hover:bg-gray-200 active:scale-95 transition">
              🔄 Coba Lagi
            </button>
          </>
        )}
      </div>
    </div>
  )
}
