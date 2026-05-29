import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatPoints(n: number): string {
  return n.toLocaleString('id-ID')
}

export function calcWatchMinutes(points: number, rate: number): number {
  return Math.floor(points / rate)
}
