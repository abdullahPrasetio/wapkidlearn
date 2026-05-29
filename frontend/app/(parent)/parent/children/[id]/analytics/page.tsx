'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { parent } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

export default function ChildAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', id],
    queryFn: () => parent.getAnalytics(id),
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pt-4">
        <Link href={`/parent/children/${id}`} className="text-gray-400">←</Link>
        <h1 className="text-xl font-bold text-gray-900">Laporan</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      ) : data && (
        <>
          {/* Streak */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
              <p className="text-xs text-orange-500 font-medium">Streak Saat Ini</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{data.current_streak}</p>
              <p className="text-xs text-orange-400">hari berturut</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
              <p className="text-xs text-yellow-600 font-medium">Streak Terpanjang</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{data.longest_streak}</p>
              <p className="text-xs text-yellow-400">hari</p>
            </div>
          </div>

          {/* Points per day */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Poin per Hari</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.points_per_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="points" fill="#FF6B35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Watch time per day */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Waktu Nonton per Hari (menit)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.watch_time_per_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="minutes" fill="#118AB2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Accuracy per topic */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Akurasi per Topik</h3>
            <div className="space-y-3">
              {data.accuracy_per_topic.map((t) => (
                <div key={t.topic}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{t.topic}</span>
                    <span className="font-medium text-gray-900">{t.accuracy}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${t.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
