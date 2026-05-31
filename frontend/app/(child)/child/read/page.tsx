'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { reading } from '@/lib/api'
import type { ReadingPassage } from '@/lib/types'

type Tab = 'word' | 'sentence' | 'story'

const TABS: { key: Tab; label: string; emoji: string; desc: string }[] = [
  { key: 'word', label: 'Kata', emoji: '🔤', desc: 'Baca satu kata' },
  { key: 'sentence', label: 'Kalimat', emoji: '💬', desc: 'Baca satu kalimat' },
  { key: 'story', label: 'Cerita', emoji: '📖', desc: 'Baca cerita pendek' },
]

const GRADE_COLORS = ['bg-green-100 text-green-700', 'bg-teal-100 text-teal-700', 'bg-yellow-100 text-yellow-700', 'bg-orange-100 text-orange-700', 'bg-red-100 text-red-700', 'bg-purple-100 text-purple-700']

function WordGrid({ passages }: { passages: ReadingPassage[] }) {
  return (
    <div className="px-5 grid grid-cols-3 sm:grid-cols-4 gap-3">
      {passages.map((p) => (
        <Link
          key={p.id}
          href={`/child/read/${p.id}`}
          className="bg-white border border-gray-100 rounded-2xl p-3 flex flex-col items-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition"
        >
          <span className="text-4xl sm:text-5xl">{p.emoji}</span>
          <p className="font-extrabold text-gray-900 text-sm text-center leading-tight">{p.title}</p>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{p.id.split('-')[1].toUpperCase()}</span>
        </Link>
      ))}
    </div>
  )
}

function SentenceList({ passages }: { passages: ReadingPassage[] }) {
  return (
    <div className="px-5 space-y-3">
      {passages.map((p) => (
        <Link
          key={p.id}
          href={`/child/read/${p.id}`}
          className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md active:scale-95 transition"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl">
            {p.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-gray-900 text-sm">{p.title}</p>
            <p className="text-gray-500 text-xs mt-0.5 truncate">{p.body}</p>
            <span className="text-[10px] font-bold text-blue-500 mt-1 inline-block">{p.word_count} kata</span>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={2} className="w-5 h-5 flex-shrink-0">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      ))}
    </div>
  )
}

function StoryList({ passages, grade, setGrade }: { passages: ReadingPassage[] | undefined; grade: number; setGrade: (g: number) => void }) {
  return (
    <>
      <div className="px-5 mb-4">
        <p className="text-xs font-bold text-gray-500 mb-2">Pilih Kelas</p>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map((g) => (
            <button
              key={g}
              onClick={() => setGrade(g)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition ${
                grade === g ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Kelas {g}
            </button>
          ))}
        </div>
      </div>
      <div className="px-5 space-y-3">
        {passages?.map((p, i) => (
          <Link
            key={p.id}
            href={`/child/read/${p.id}`}
            className="block bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md active:scale-95 transition"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📖</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-gray-900 text-base leading-tight">{p.title}</p>
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">{p.body}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${GRADE_COLORS[(grade - 1) % GRADE_COLORS.length]}`}>
                    Kelas {grade}
                  </span>
                  <span className="text-xs text-gray-400">{p.word_count} kata</span>
                </div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={2} className="w-5 h-5 flex-shrink-0 mt-1">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

export default function ReadListPage() {
  const [tab, setTab] = useState<Tab>('word')
  const [grade, setGrade] = useState(1)

  const { data: wordData, isLoading: loadingWord } = useQuery({
    queryKey: ['reading-passages-word'],
    queryFn: () => reading.getByType('word'),
    staleTime: 300_000,
  })

  const { data: sentenceData, isLoading: loadingSentence } = useQuery({
    queryKey: ['reading-passages-sentence'],
    queryFn: () => reading.getByType('sentence'),
    staleTime: 300_000,
  })

  const { data: storyData, isLoading: loadingStory } = useQuery({
    queryKey: ['reading-passages-story', grade],
    queryFn: () => reading.getPassages(grade),
    enabled: tab === 'story',
    staleTime: 60_000,
  })

  const isLoading = (tab === 'word' && loadingWord) || (tab === 'sentence' && loadingSentence) || (tab === 'story' && loadingStory)

  return (
    <div className="min-h-screen bg-white font-nunito pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Link href="/child/learn" className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2.5} className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Baca & Rekam</h1>
          <p className="text-xs text-gray-400">Pilih level latihanmu</p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="px-5 mb-5">
        <div className="bg-gray-100 rounded-2xl p-1 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition text-center ${
                tab === t.key ? 'bg-white shadow-sm' : ''
              }`}
            >
              <span className="text-xl">{t.emoji}</span>
              <span className={`text-xs font-extrabold mt-0.5 ${tab === t.key ? 'text-gray-900' : 'text-gray-400'}`}>{t.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          {TABS.find((t) => t.key === tab)?.desc}
        </p>
      </div>

      {isLoading && (
        <div className="text-center py-10 text-gray-400 text-sm">Memuat…</div>
      )}

      {!isLoading && tab === 'word' && <WordGrid passages={wordData ?? []} />}
      {!isLoading && tab === 'sentence' && <SentenceList passages={sentenceData ?? []} />}
      {!isLoading && tab === 'story' && <StoryList passages={storyData} grade={grade} setGrade={setGrade} />}
    </div>
  )
}
