'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { admin } from '@/lib/api'
import type { MathQuestion } from '@/lib/types'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

const TOPICS = ['penjumlahan', 'pengurangan', 'perkalian', 'pembagian', 'campuran']

const TOPIC_COLORS: Record<string, string> = {
  penjumlahan: 'bg-[#ffdbca] text-[#783200]',
  pengurangan: 'bg-[#d8e2ff] text-[#004395]',
  perkalian: 'bg-[#dcfce7] text-[#166534]',
  pembagian: 'bg-[#e7eefe] text-[#151c27]',
  campuran: 'bg-[#fef3c7] text-[#92400e]',
}

const emptyForm = (): Omit<MathQuestion, 'id'> => ({
  grade_level: 1,
  topic: 'penjumlahan',
  difficulty: 1,
  question_text: '',
  options: ['', '', '', ''],
  correct_answer: '',
  explanation: '',
  is_active: true,
})

export default function AdminQuestionsPage() {
  const qc = useQueryClient()
  const { data: questions, isLoading } = useQuery({
    queryKey: ['admin-questions'],
    queryFn: admin.listQuestions,
  })

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MathQuestion | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState<number | null>(null)

  const createMut = useMutation({
    mutationFn: admin.createQuestion,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-questions'] }); resetForm() },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<MathQuestion> }) => admin.updateQuestion(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-questions'] }); resetForm() },
  })
  const deleteMut = useMutation({
    mutationFn: admin.deleteQuestion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-questions'] }),
  })

  function resetForm() {
    setShowForm(false); setEditing(null); setForm(emptyForm())
  }

  function openEdit(q: MathQuestion) {
    setEditing(q)
    setForm({ grade_level: q.grade_level, topic: q.topic, difficulty: q.difficulty, question_text: q.question_text, options: [...q.options], correct_answer: q.correct_answer, explanation: q.explanation ?? '', is_active: q.is_active })
    setShowForm(true)
  }

  function submit() {
    if (editing) updateMut.mutate({ id: editing.id, body: form })
    else createMut.mutate(form)
  }

  const filtered = questions?.filter((q) => {
    const matchSearch = !search || q.question_text.toLowerCase().includes(search.toLowerCase()) || q.topic.includes(search.toLowerCase())
    const matchGrade = gradeFilter === null || q.grade_level === gradeFilter
    return matchSearch && matchGrade
  }) ?? []

  return (
    <div className="flex bg-wkl-background min-h-screen">
      <AdminSidebar />

      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-wkl-surface border-b border-wkl-outline-variant flex justify-between items-center w-full px-6 py-4 z-30 sticky top-0 md:pl-8">
          <div className="flex items-center gap-3 md:hidden">
            <span className="material-symbols-outlined text-wkl-primary text-3xl">school</span>
            <h1 className="text-xl font-bold text-wkl-primary">WapKidLearn</h1>
          </div>
          <div className="hidden md:block">
            <h1 className="text-2xl font-bold text-wkl-on-background">Bank Soal</h1>
          </div>
          <button className="hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined text-wkl-on-surface-variant text-2xl">account_circle</span>
          </button>
        </header>

        <main className="flex-grow p-4 md:p-8 pb-28 md:pb-8 flex flex-col gap-6">
          <div className="md:hidden">
            <h1 className="text-2xl font-bold text-wkl-on-background mb-1">Bank Soal</h1>
            <p className="text-sm text-wkl-on-surface-variant">Manage and create learning questions.</p>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col md:flex-row gap-2 md:items-center w-full">
            <div className="relative flex-grow">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-wkl-on-surface-variant">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-wkl-surface-lowest border-2 border-wkl-outline-variant rounded text-sm text-wkl-on-background focus:border-wkl-secondary focus:ring-4 focus:ring-wkl-secondary/20 outline-none h-11"
                placeholder="Cari soal..."
              />
            </div>
            <div className="flex overflow-x-auto gap-2 pb-1 md:pb-0 shrink-0">
              {[null, 1, 2, 3, 4, 5, 6].map((g) => (
                <button
                  key={g ?? 'all'}
                  onClick={() => setGradeFilter(g)}
                  className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 border transition-colors ${
                    gradeFilter === g
                      ? 'bg-wkl-secondary-container text-wkl-on-secondary-container border-transparent'
                      : 'bg-wkl-surface-lowest border-wkl-outline-variant text-wkl-on-surface-variant hover:bg-wkl-surface-variant'
                  }`}
                >
                  {g === null ? 'Semua' : `Kelas ${g}`}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-wkl-surface-lowest border border-wkl-outline-variant rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-wkl-on-surface">{editing ? 'Edit Soal' : 'Soal Baru'}</h2>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-wkl-on-surface-variant">Kelas</label>
                  <select value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: +e.target.value })} className="w-full border-2 border-wkl-outline-variant rounded px-2 py-1.5 text-sm mt-1 bg-white">
                    {[1,2,3,4,5,6].map((g) => <option key={g} value={g}>Kelas {g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-wkl-on-surface-variant">Topik</label>
                  <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="w-full border-2 border-wkl-outline-variant rounded px-2 py-1.5 text-sm mt-1 bg-white">
                    {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-wkl-on-surface-variant">Kesulitan (1-5)</label>
                  <input type="number" min={1} max={5} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: +e.target.value })} className="w-full border-2 border-wkl-outline-variant rounded px-2 py-1.5 text-sm mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs text-wkl-on-surface-variant">Pertanyaan</label>
                <input value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} className="w-full border-2 border-wkl-outline-variant rounded px-3 py-2 text-sm mt-1" placeholder="Contoh: Berapa 5 + 3?" />
              </div>
              <div>
                <label className="text-xs text-wkl-on-surface-variant">Pilihan Jawaban</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {form.options.map((opt, i) => (
                    <input key={i} value={opt} onChange={(e) => { const opts = [...form.options]; opts[i] = e.target.value; setForm({ ...form, options: opts }) }} className="border-2 border-wkl-outline-variant rounded px-2 py-1.5 text-sm" placeholder={`Opsi ${i + 1}`} />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-wkl-on-surface-variant">Jawaban Benar</label>
                  <input value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} className="w-full border-2 border-wkl-outline-variant rounded px-2 py-1.5 text-sm mt-1" placeholder="Harus sama persis" />
                </div>
                <div>
                  <label className="text-xs text-wkl-on-surface-variant">Penjelasan (opsional)</label>
                  <input value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} className="w-full border-2 border-wkl-outline-variant rounded px-2 py-1.5 text-sm mt-1" placeholder="Penjelasan singkat" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={resetForm} className="text-sm text-wkl-on-surface-variant px-4 py-2">Batal</button>
                <button onClick={submit} disabled={createMut.isPending || updateMut.isPending} className="bg-wkl-primary-container text-white text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-50">
                  {editing ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </div>
          )}

          {/* Question grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 bg-wkl-surface-lowest border border-wkl-outline-variant rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((q) => {
                const topicClass = TOPIC_COLORS[q.topic] ?? 'bg-wkl-surface-container text-wkl-on-surface'
                return (
                  <div key={q.id} className="bg-wkl-surface-lowest border border-[#E5E7EB] rounded-xl p-4 flex flex-col gap-2 hover:border-wkl-outline-variant transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${topicClass}`}>{q.topic}</span>
                        <span className="bg-wkl-surface-variant text-wkl-on-surface-variant px-2 py-1 rounded-full text-xs">G{q.grade_level}</span>
                      </div>
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <span key={i} className={`material-symbols-outlined text-[18px] ${i < q.difficulty ? 'fill' : ''}`} style={{ fontVariationSettings: i < q.difficulty ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-base font-semibold text-wkl-on-background py-2">{q.question_text}</p>
                    {!q.is_active && <span className="text-xs text-wkl-error bg-wkl-error-container px-2 py-0.5 rounded-full w-fit">Nonaktif</span>}
                    <div className="mt-auto pt-2 border-t border-[#E5E7EB] flex justify-end gap-2">
                      <button onClick={() => openEdit(q)} className="p-2 text-wkl-on-surface-variant hover:text-wkl-primary transition-colors rounded hover:bg-wkl-surface-variant">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button onClick={() => { if (confirm('Hapus soal ini?')) deleteMut.mutate(q.id) }} className="p-2 text-wkl-on-surface-variant hover:text-wkl-error transition-colors rounded hover:bg-wkl-error-container">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                )
              })}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-16 text-wkl-on-surface-variant">
                  <p className="text-4xl mb-3">📝</p>
                  <p className="font-medium">Belum ada soal.</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* FAB */}
        <div className="fixed bottom-20 md:bottom-6 right-6 md:right-8 z-50">
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="bg-wkl-primary-container text-white font-semibold h-11 px-6 rounded-full shadow-lg flex items-center gap-2 hover:opacity-90 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined">add</span>
            Tambah Soal
          </button>
        </div>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 w-full z-40 bg-wkl-surface-lowest shadow-[0px_-4px_12px_rgba(17,24,39,0.05)] rounded-t-xl flex justify-around items-center px-4 pb-safe pt-1 md:hidden h-[72px]">
          {[
            { href: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
            { href: '/admin/questions', icon: 'menu_book', label: 'Soal', active: true },
            { href: '/admin/videos', icon: 'movie', label: 'Video' },
            { href: '/admin/users', icon: 'person', label: 'Users' },
          ].map((item) => (
            <a key={item.href} href={item.href} className={`flex flex-col items-center justify-center w-16 h-full rounded-lg transition-colors ${item.active ? 'bg-wkl-primary-container text-white rounded-full px-4 py-1' : 'text-wkl-on-surface-variant hover:bg-wkl-surface-variant'}`}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-[10px] mt-1">{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}
