import type {
  Achievement, AnswerResult, ChildAnalytics, ChildProfile, CombinedWallet, ConvertResult,
  GameSession, MathQuestion, ParentSettings, PointTransaction,
  Question, SessionSummary, Video, WatchSession,
} from './types'

// Server-side (SSR/Server Components) pakai INTERNAL_API_URL via Docker network.
// Client-side (browser) pakai NEXT_PUBLIC_API_URL yang di-embed saat build.
const BASE = typeof window === 'undefined'
  ? `${process.env.INTERNAL_API_URL ?? 'http://localhost:8080'}/api/v1`
  : (process.env.NEXT_PUBLIC_API_URL ?? '/api/v1')

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

type BackendResponse<T> = { success: boolean; data?: T; error?: string; message?: string }

async function parseBody<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T
  const body: BackendResponse<T> = await res.json().catch(() => ({}))
  return (body.data ?? body) as T
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })

  if (res.status === 401) {
    const refreshed = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!refreshed.ok) {
      window.location.href = '/login'
      throw new ApiError(401, 'Session expired')
    }
    const retry = await fetch(`${BASE}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    })
    if (!retry.ok) {
      const err: BackendResponse<unknown> = await retry.json().catch(() => ({}))
      throw new ApiError(retry.status, err.error || retry.statusText)
    }
    return parseBody<T>(retry)
  }

  if (!res.ok) {
    const err: BackendResponse<unknown> = await res.json().catch(() => ({}))
    throw new ApiError(res.status, err.error || res.statusText)
  }

  return parseBody<T>(res)
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    request<{ role: string; user_id: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  childLogin: (childId: string, pin: string) =>
    request<{ role: string; user_id: string }>('/auth/child/login', {
      method: 'POST',
      body: JSON.stringify({ child_id: childId, pin }),
    }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
}

// ── Game ──────────────────────────────────────────────────────────────────────
export const game = {
  startSession: () =>
    request<GameSession>('/child/sessions', { method: 'POST' }),
  getQuestion: (sessionId: string) =>
    request<Question>(`/child/sessions/${sessionId}/question`),
  submitAnswer: (sessionId: string, body: {
    question_id: string
    submitted_answer: string
    time_taken_seconds: number
    nonce: string
  }) =>
    request<AnswerResult>(`/child/sessions/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  endSession: (sessionId: string) =>
    request<void>(`/child/sessions/${sessionId}/end`, { method: 'POST' }),
  getSessionSummary: (sessionId: string) =>
    request<SessionSummary>(`/child/sessions/${sessionId}/summary`),
}

// ── Points ────────────────────────────────────────────────────────────────────
export const points = {
  getWallet: () => request<CombinedWallet>('/child/wallet'),
  convert: (body: { points: number; idempotency_key: string }) =>
    request<ConvertResult>('/child/convert', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getTransactions: () => request<PointTransaction[]>('/child/transactions'),
}

// ── Videos (child) ────────────────────────────────────────────────────────────
export const videos = {
  list: () => request<Video[]>('/child/videos'),
  create: (body: { title: string; url: string }) =>
    request<Video>('/child/videos', { method: 'POST', body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/child/videos/${id}`, { method: 'DELETE' }),
}

// ── Watch Sessions ────────────────────────────────────────────────────────────
export const watchSessions = {
  start: (videoId: string) =>
    request<WatchSession>('/child/watch-sessions', {
      method: 'POST',
      body: JSON.stringify({ video_id: videoId }),
    }),
  heartbeat: (sessionId: string, elapsed: number) =>
    request<{ remaining_seconds: number }>(
      `/child/watch-sessions/${sessionId}/heartbeat`,
      { method: 'PATCH', body: JSON.stringify({ elapsed_seconds: elapsed }) }
    ),
  end: (sessionId: string) =>
    request<void>(`/child/watch-sessions/${sessionId}`, { method: 'DELETE' }),
}

// ── Parent ────────────────────────────────────────────────────────────────────
export const parent = {
  listChildren: () => request<ChildProfile[]>('/parent/children'),
  addChild: (body: {
    display_name: string
    pin: string
    grade_level: number
  }) =>
    request<ChildProfile>('/parent/children', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getSettings: (childId: string) =>
    request<ParentSettings>(`/parent/children/${childId}/settings`),
  updateSettings: (childId: string, settings: Partial<ParentSettings>) =>
    request<void>(`/parent/children/${childId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  lock: (childId: string) =>
    request<void>(`/parent/children/${childId}/lock`, { method: 'POST' }),
  unlock: (childId: string) =>
    request<void>(`/parent/children/${childId}/lock`, { method: 'DELETE' }),
  getAnalytics: (childId: string) =>
    request<ChildAnalytics>(`/parent/children/${childId}/analytics`),
  listVideos: (childId: string) =>
    request<Video[]>(`/parent/children/${childId}/videos`),
  addVideo: (childId: string, body: { title: string; url: string }) =>
    request<Video>(`/parent/children/${childId}/videos`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteVideo: (childId: string, videoId: string) =>
    request<void>(`/parent/children/${childId}/videos/${videoId}`, { method: 'DELETE' }),
  approveVideo: (id: string) =>
    request<void>(`/parent/videos/${id}/approve`, { method: 'PATCH' }),
  rejectVideo: (id: string, reason: string) =>
    request<void>(`/parent/videos/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const admin = {
  listQuestions: () => request<MathQuestion[]>('/admin/questions'),
  createQuestion: (body: Omit<MathQuestion, 'id'>) =>
    request<MathQuestion>('/admin/questions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateQuestion: (id: string, body: Partial<MathQuestion>) =>
    request<MathQuestion>(`/admin/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteQuestion: (id: string) =>
    request<void>(`/admin/questions/${id}`, { method: 'DELETE' }),
  listVideos: () => request<Video[]>('/admin/videos/all'),
  approveVideo: (id: string) =>
    request<void>(`/admin/videos/${id}/approve`, { method: 'PATCH' }),
  rejectVideo: (id: string, reason: string) =>
    request<void>(`/admin/videos/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
  deleteVideo: (id: string) =>
    request<void>(`/admin/videos/${id}`, { method: 'DELETE' }),
  addVideo: (body: { title: string; url: string; scope: string }) =>
    request<Video>('/admin/videos', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listUsers: () => request<{ id: string; email: string; role: string; is_active: boolean }[]>('/admin/users'),
  toggleUser: (id: string) =>
    request<void>(`/admin/users/${id}/toggle`, { method: 'PATCH' }),
}

export const achievements = {
  list: () => request<Achievement[]>('/child/achievements'),
}

export { ApiError }
