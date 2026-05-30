export type Role = 'super_admin' | 'parent' | 'child'

export interface User {
  id: string
  email: string
  role: Role
  display_name?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Game
export interface GameSession {
  id: string
  child_id: string
  total_questions: number
  correct_count: number
  points_earned: number
  started_at: string
  ended_at?: string
}

export interface Question {
  session_id: string
  question_id: string
  question_text: string
  options: string[]
  difficulty: number
  grade_level: number
  topic: string
  nonce: string
  time_limit_seconds: number
}

export interface AnswerResult {
  is_correct: boolean
  correct_answer: string
  explanation?: string
  points_earned: number
  wallet_balance: number
  streak: number
}

export interface SessionSummary {
  session_id: string
  total_questions: number
  correct_count: number
  accuracy_pct: number
  points_earned: number
  duration_seconds: number
}

// Points
export interface Wallet {
  balance: number
  lifetime_earned: number
}

export interface CombinedWallet {
  point: Wallet
  watch: WatchWallet
  is_locked: boolean
  display_name: string
  current_streak: number
  longest_streak: number
  conversion_rate: number
}

export interface WatchWallet {
  balance_seconds: number
  used_today_seconds: number
  last_reset_date: string
}

export interface ConvertResult {
  points_spent: number
  watch_time_added_seconds: number
  watch_balance_seconds: number
}

export interface PointTransaction {
  id: string
  type: 'earn' | 'spend'
  amount: number
  description: string
  created_at: string
}

// Video
export type VideoType = 'youtube' | 'mp4' | 'vimeo'
export type VideoStatus = 'pending' | 'active' | 'rejected'

export interface Video {
  id: string
  title: string
  url: string
  thumbnail_url?: string
  video_type: VideoType
  status: VideoStatus
  scope: 'global' | 'child_specific'
  duration_seconds?: number
  required_points?: number
}

export interface WatchSession {
  id: string
  video_id: string
  video_url: string
  video_title: string
  video_type: string
  allocated_seconds: number
}

// Parent
export interface ChildProfile {
  id: string
  user_id: string
  display_name: string
  username: string
  grade_level: number
  current_level: number
  is_locked: boolean
  avatar: string
}

export interface ParentSettings {
  daily_watch_limit_minutes: number
  conversion_rate: number
  // keys are hour strings "0"–"23", value true = allowed
  allowed_hours: Record<string, boolean>
  require_study_first: boolean
  min_study_minutes: number
  emergency_lock: boolean
}

export interface ChildAnalytics {
  points_per_day: { date: string; points: number }[]
  watch_time_per_day: { date: string; minutes: number }[]
  accuracy_per_topic: { topic: string; accuracy: number }[]
  current_streak: number
  longest_streak: number
}

// Admin
export interface MathQuestion {
  id: string
  grade_level: number
  topic: string
  difficulty: number
  question_text: string
  options: string[]
  correct_answer: string
  explanation?: string
  is_active: boolean
}

export interface Achievement {
  id: string
  code: string
  title: string
  description: string
  unlocked: boolean
  unlocked_at?: string
}

export interface ActivityItem {
  type: 'game' | 'watch'
  title: string
  detail: string
  occurred_at: string
}
