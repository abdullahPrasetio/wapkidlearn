'use client'

import type { Role } from './types'

export function getStoredRole(): Role | null {
  if (typeof window === 'undefined') return null
  return (localStorage.getItem('wkl_role') as Role) ?? null
}

export function setStoredRole(role: Role): void {
  localStorage.setItem('wkl_role', role)
}

export function clearStoredRole(): void {
  localStorage.removeItem('wkl_role')
}

export function getRedirectPath(role: Role): string {
  switch (role) {
    case 'super_admin': return '/admin/dashboard'
    case 'parent':      return '/parent/dashboard'
    case 'child':       return '/child/home'
  }
}
