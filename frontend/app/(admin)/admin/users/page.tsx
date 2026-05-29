'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { admin } from '@/lib/api'
import Link from 'next/link'

export default function AdminUsersPage() {
  const qc = useQueryClient()
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: admin.listUsers,
  })

  const toggleMut = useMutation({
    mutationFn: admin.toggleUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const roleLabel: Record<string, string> = {
    super_admin: '👑 Admin',
    parent: '👨‍👩‍👧 Orang Tua',
    child: '🧒 Anak',
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/dashboard" className="text-gray-400 text-sm">← Back</Link>
        <h1 className="text-xl font-bold text-gray-900">Manajemen User</h1>
      </div>

      {isLoading && <p className="text-gray-400 text-sm text-center py-8">Memuat...</p>}

      <div className="space-y-2">
        {users?.map(u => (
          <div key={u.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-gray-500">{roleLabel[u.role] ?? u.role}</span>
                {!u.is_active && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Nonaktif</span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 truncate">{u.email || '(no email)'}</p>
              <p className="text-xs text-gray-400 font-mono truncate">{u.id}</p>
            </div>
            <button
              onClick={() => {
                const action = u.is_active ? 'nonaktifkan' : 'aktifkan'
                if (confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} user ini?`)) {
                  toggleMut.mutate(u.id)
                }
              }}
              disabled={toggleMut.isPending}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium shrink-0 disabled:opacity-50 ${
                u.is_active
                  ? 'bg-red-100 text-red-600'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </div>
        ))}
        {users?.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">Belum ada user.</p>
        )}
      </div>
    </div>
  )
}
