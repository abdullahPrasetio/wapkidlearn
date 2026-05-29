'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { points } from '@/lib/api'
import { formatPoints, formatSeconds, calcWatchMinutes } from '@/lib/utils'

interface Props {
  balance: number
  watchBalanceSeconds: number
  usedTodaySeconds: number
  onConverted: () => void
  conversionRate?: number
}

export function ConvertSlider({
  balance,
  watchBalanceSeconds,
  usedTodaySeconds,
  onConverted,
  conversionRate = 10,
}: Props) {
  const [amount, setAmount] = useState(conversionRate)
  const watchMinutes = calcWatchMinutes(amount, conversionRate)
  const max = Math.max(conversionRate, Math.floor(balance / conversionRate) * conversionRate)

  const mutation = useMutation({
    mutationFn: () =>
      points.convert({
        points: amount,
        idempotency_key: crypto.randomUUID(),
      }),
    onSuccess: () => {
      onConverted()
      setAmount(conversionRate)
    },
  })

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
      <h3 className="font-bold text-gray-900">Tukar Poin ke Waktu Nonton</h3>

      {/* Slider */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-500">
          <span>{formatPoints(amount)} poin</span>
          <span className="font-medium text-blue-600">= {watchMinutes} menit</span>
        </div>
        <input
          type="range"
          min={conversionRate}
          max={max}
          step={conversionRate}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full accent-orange-500"
          disabled={balance < conversionRate}
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>{conversionRate} poin min</span>
          <span>{formatPoints(max)} poin maks</span>
        </div>
      </div>

      {/* Rate info */}
      <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 text-center">
        Rate: {conversionRate} poin = 1 menit nonton
      </div>

      {mutation.isError && (
        <p className="text-red-500 text-sm text-center">
          {mutation.error instanceof Error ? mutation.error.message : 'Gagal menukar poin'}
        </p>
      )}

      {mutation.isSuccess && (
        <p className="text-green-500 text-sm text-center">
          ✅ Berhasil! +{watchMinutes} menit ditambahkan
        </p>
      )}

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || balance < conversionRate || watchMinutes < 1}
        className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl text-lg hover:bg-orange-600 active:scale-95 transition disabled:opacity-50"
      >
        {mutation.isPending
          ? 'Menukar...'
          : `Tukar ${formatPoints(amount)} poin → ${watchMinutes} menit`}
      </button>

      {balance < conversionRate && (
        <p className="text-center text-gray-400 text-sm">
          Kumpulkan minimal {conversionRate} poin dulu ya!
        </p>
      )}
    </div>
  )
}
