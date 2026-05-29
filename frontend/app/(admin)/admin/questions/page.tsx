'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { admin } from '@/lib/api'
import type { MathQuestion } from '@/lib/types'
import Link from 'next/link'

const TOPICS = ['penjumlahan', 'pengurangan', 'perkalian', 'pembagian', 'campuran']

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

  const createMut = useMutation({
    mutationFn: admin.createQuestion,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-questions'] }); resetForm() },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<MathQuestion> }) =>
      admin.updateQuestion(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-questions'] }); resetForm() },
  })
  const deleteMut = useMutation({
    mutationFn: admin.deleteQuestion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-questions'] }),
  })

  function resetForm() {
    setShowForm(false)
    setEditing(null)
    setForm(emptyForm())
  }

  function openEdit(q: MathQuestion) {
    setEditing(q)
    setForm({
      grade_level: q.grade_level,
      topic: q.topic,
      difficulty: q.difficulty,
      question_text: q.question_text,
      options: [...q.options],
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? '',
      is_active: q.is_active,
    })
    setShowForm(true)
  }

  function submit() {
    if (editing) {
      updateMut.mutate({ id: editing.id, body: form })
    } else {
      createMut.mutate(form)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/dashboard" className="text-gray-400 text-sm">← Back</Link>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Bank Soal</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-blue-500 text-white text-sm px-4 py-2 rounded-xl font-medium"
        >
          + Tambah
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <h2 className="font-bold">{editing ? 'Edit Soal' : 'Soal Baru'}</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">Kelas</label>
              <select
                value={form.grade_level}
                onChange={e => setForm({ ...form, grade_level: +e.target.value })}
                className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1"
              >
                {[1,2,3,4,5,6].map(g => <option key={g} value={g}>Kelas {g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Topik</label>
              <select
                value={form.topic}
                onChange={e => setForm({ ...form, topic: e.target.value })}
                className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1"
              >
                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Kesulitan (1-5)</label>
              <input
                type="number" min={1} max={5}
                value={form.difficulty}
                onChange={e => setForm({ ...form, difficulty: +e.target.value })}
                className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Pertanyaan</label>
            <input
              value={form.question_text}
              onChange={e => setForm({ ...form, question_text: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              placeholder="Contoh: Berapa 5 + 3?"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Pilihan Jawaban (4 opsi)</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {form.options.map((opt, i) => (
                <input
                  key={i}
                  value={opt}
                  onChange={e => {
                    const opts = [...form.options]
                    opts[i] = e.target.value
                    setForm({ ...form, options: opts })
                  }}
                  className="border rounded-lg px-2 py-1.5 text-sm"
                  placeholder={`Opsi ${i + 1}`}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Jawaban Benar</label>
              <input
                value={form.correct_answer}
                onChange={e => setForm({ ...form, correct_answer: e.target.value })}
                className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1"
                placeholder="Harus sama persis dengan salah satu opsi"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Penjelasan (opsional)</label>
              <input
                value={form.explanation}
                onChange={e => setForm({ ...form, explanation: e.target.value })}
                className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1"
                placeholder="Penjelasan singkat"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={resetForm} className="text-sm text-gray-500 px-4 py-2">Batal</button>
            <button
              onClick={submit}
              disabled={createMut.isPending || updateMut.isPending}
              className="bg-blue-500 text-white text-sm px-4 py-2 rounded-xl font-medium disabled:opacity-50"
            >
              {editing ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-gray-400 text-sm text-center py-8">Memuat...</p>}

      <div className="space-y-2">
        {questions?.map(q => (
          <div key={q.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Kelas {q.grade_level}</span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{q.topic}</span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">⭐ {q.difficulty}</span>
                  {!q.is_active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Nonaktif</span>}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{q.question_text}</p>
                <p className="text-xs text-gray-400 mt-0.5">Jawaban: <span className="text-green-600 font-medium">{q.correct_answer}</span></p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(q)} className="text-xs text-blue-500 font-medium">Edit</button>
                <button
                  onClick={() => { if (confirm('Nonaktifkan soal ini?')) deleteMut.mutate(q.id) }}
                  className="text-xs text-red-400 font-medium"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
        {questions?.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">Belum ada soal.</p>
        )}
      </div>
    </div>
  )
}
