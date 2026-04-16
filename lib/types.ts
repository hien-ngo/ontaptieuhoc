export type Subject = 'math' | 'vietnamese'

export type MathQuestionType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'compare'
  | 'sort_numbers'
  | 'clock_reading'
  | 'weekday'
  | 'measurement'
  | 'word_problem'
  | 'shape_count'
  | 'true_false'
  | 'missing_number'

export type VietnameseQuestionType =
  | 'dien_van'
  | 'dien_chu'
  | 'chon_tu_dung'
  | 'phan_biet_am'
  | 'sap_xep_cau'
  | 'tim_tu'
  | 'noi_tu_hinh'
  | 'dien_dau'
  | 'doc_hieu'
  | 'dung_sai'
  | 'hoan_thanh_cau'
  | 'dem_tieng'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Question {
  id: string
  chapter: string
  type: string
  difficulty: Difficulty
  question: string
  options?: string[]
  blanks?: number
  answer: string | string[]
  explanation?: string
  hint?: string
  tags?: string[]
  image?: string
}

export interface Chapter {
  id: string
  name: string
  icon: string
  order: number
  description?: string
}

export interface QuestionBank {
  metadata: { title: string; total_questions: number }
  chapters: Chapter[]
  questions: Question[]
}

export interface LessonNode {
  id: string
  chapterId: string
  chapterName: string
  chapterIcon: string
  nodeIndex: number
  label: string
  status: 'completed' | 'current' | 'locked'
  stars: number
}

export interface Progress {
  subject: Subject
  completedNodes: Record<string, { stars: number; bestScore: number }>
  totalStars: number
  dailyStars: Record<string, number>
  streak: number
  lastPlayedDate: string
}

export interface PracticeResult {
  score: number
  total: number
  maxCombo: number
  timeSeconds: number
  answers: { questionId: string; correct: boolean }[]
}
