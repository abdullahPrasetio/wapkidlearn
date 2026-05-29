'use client'

import { useQuery } from '@tanstack/react-query'
import { points } from '@/lib/api'

export function useWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: points.getWallet,
    staleTime: 10_000,
  })
}
