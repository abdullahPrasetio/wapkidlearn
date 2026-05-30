'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LearnSelectPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white font-nunito">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-2">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2.5} className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Belajar</h1>
          <p className="text-xs text-gray-400">Pilih mode belajar</p>
        </div>
      </div>

      {/* Subtitle */}
      <div className="px-5 pt-4 pb-6">
        <p className="text-gray-500 text-sm">Kamu mau belajar apa hari ini?</p>
      </div>

      {/* Options */}
      <div className="px-5 space-y-4">
        {/* Menghitung */}
        <Link
          href="/child/game"
          className="block bg-orange-50 border-2 border-orange-100 rounded-3xl p-6 hover:shadow-lg hover:border-orange-300 active:scale-95 transition"
        >
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-5xl">🎮</span>
            </div>
            <div className="flex-1">
              <p className="text-xl font-extrabold text-gray-900">Menghitung</p>
              <p className="text-sm text-gray-500 mt-1">
                Latihan matematika dengan soal pilihan ganda. Jawab dengan cepat dan tepat!
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
                  +100 Poin
                </span>
                <span className="text-xs text-gray-400">per sesi</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Membaca */}
        <Link
          href="/child/read"
          className="block bg-green-50 border-2 border-green-100 rounded-3xl p-6 hover:shadow-lg hover:border-green-300 active:scale-95 transition"
        >
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-5xl">📚</span>
            </div>
            <div className="flex-1">
              <p className="text-xl font-extrabold text-gray-900">Membaca</p>
              <p className="text-sm text-gray-500 mt-1">
                Baca cerita dengan suara keras, rekam, dan cek akurasi bacaanmu!
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                  +80 Poin
                </span>
                <span className="text-xs text-gray-400">per cerita</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Tips */}
      <div className="mx-5 mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-blue-700 mb-1">💡 Tips</p>
        <p className="text-xs text-blue-600">
          Belajar setiap hari untuk menjaga streak dan mendapatkan bonus poin!
        </p>
      </div>
    </div>
  )
}
