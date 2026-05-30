'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { points } from '@/lib/api'
import type { PointTransaction } from '@/lib/types'
import Link from 'next/link'

type Filter = 'all' | 'earn' | 'spend'

function groupByMonth(txs: PointTransaction[]) {
  const groups: Record<string, PointTransaction[]> = {}
  for (const tx of txs) {
    const key = new Date(tx.created_at).toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    }).toUpperCase()
    if (!groups[key]) groups[key] = []
    groups[key].push(tx)
  }
  return groups
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

const TX_ICONS: Record<string, string> = {
  earn: '➕',
  spend: '➖',
}

function TxIcon({ type }: { type: 'earn' | 'spend' }) {
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
      type === 'earn' ? 'bg-green-100' : 'bg-orange-100'
    }`}>
      {type === 'earn' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5} className="w-5 h-5">
          <circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth={2.5} className="w-5 h-5">
          <circle cx="12" cy="12" r="9" /><path d="M8 12h8" strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}

export default function TransactionsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const { data, isLoading, isError } = useQuery({
    queryKey: ['transactions'],
    queryFn: points.getTransactions,
  })

  const filtered = data?.filter((tx) => {
    if (filter === 'earn') return tx.type === 'earn'
    if (filter === 'spend') return tx.type === 'spend'
    return true
  }) ?? []

  const grouped = groupByMonth(filtered)
  const monthKeys = Object.keys(grouped)

  return (
    <div className="min-h-screen bg-white font-nunito">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-lg">🦉</span>
          </div>
          <span className="font-extrabold text-orange-500 text-base">WapKidLearn</span>
        </div>
        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2} className="w-5 h-5">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      </div>

      <div className="px-5 pb-6 space-y-5">
        {/* Back + title */}
        <div className="flex items-center gap-3">
          <Link
            href="/child/rewards"
            className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2.5} className="w-4 h-4">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" />
            </svg>
          </Link>
          <h1 className="text-xl font-extrabold text-gray-900">Riwayat Poin</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 bg-gray-100 rounded-2xl p-1">
          {([['all', 'Semua'], ['earn', 'Poin Masuk'], ['spend', 'Poin Keluar']] as [Filter, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition ${
                filter === val
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-gray-500 font-medium">Gagal memuat riwayat</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-gray-500 font-medium">Belum ada transaksi</p>
            <p className="text-gray-400 text-sm mt-1">Main game dan tukar poin untuk mulai</p>
          </div>
        )}

        {/* Grouped list */}
        {!isLoading && !isError && monthKeys.map((month) => (
          <div key={month}>
            <p className="text-xs font-extrabold text-gray-400 tracking-widest mb-3">{month}</p>
            <div className="space-y-2">
              {grouped[month].map((tx) => (
                <div
                  key={tx.id}
                  className={`bg-white border rounded-2xl p-4 flex items-center gap-3 shadow-sm border-l-4 ${
                    tx.type === 'earn' ? 'border-l-green-400 border-gray-100' : 'border-l-orange-400 border-gray-100'
                  }`}
                >
                  <TxIcon type={tx.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
                      {tx.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.created_at)}</p>
                  </div>
                  <p className={`font-extrabold text-sm flex-shrink-0 ${
                    tx.type === 'earn' ? 'text-green-600' : 'text-orange-500'
                  }`}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.amount} Poin
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
