'use client'

import { useQuery } from '@tanstack/react-query'
import { points } from '@/lib/api'
import Link from 'next/link'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function TransactionsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['transactions'],
    queryFn: points.getTransactions,
  })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 pt-4">
        <Link href="/child/rewards" className="text-gray-400">←</Link>
        <h1 className="text-xl font-bold text-gray-900">Riwayat Transaksi</h1>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-16 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-gray-500 font-medium">Gagal memuat riwayat</p>
          <p className="text-gray-400 text-sm mt-1">Coba lagi nanti</p>
        </div>
      )}

      {!isLoading && !isError && data?.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-gray-500 font-medium">Belum ada transaksi</p>
          <p className="text-gray-400 text-sm mt-1">Main game dan tukar poin untuk mulai</p>
        </div>
      )}

      <div className="space-y-2">
        {data?.map((tx) => (
          <div key={tx.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
              tx.type === 'earn' ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              {tx.type === 'earn' ? '⭐' : '🎬'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
              <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
            </div>
            <p className={`font-bold text-sm shrink-0 ${tx.type === 'earn' ? 'text-green-600' : 'text-orange-500'}`}>
              {tx.type === 'earn' ? '+' : '-'}{tx.amount}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
