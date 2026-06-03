// ============================================================================
// Shared domain model + IPC contract.
// Imported by BOTH the main process (DB layer) and the renderer (window.api).
// Keep this free of any Node or browser specific imports.
// ============================================================================

/** The four scored MCAT sections. */
export type SectionKey = 'cp' | 'cars' | 'bb' | 'ps'

export interface SectionMeta {
  key: SectionKey
  /** Short label, e.g. "C/P". */
  short: string
  /** Full label, e.g. "Chemical & Physical Foundations". */
  full: string
  /** Tailwind-friendly accent color (hex) used for charts & tags. */
  color: string
}

export const SECTIONS: SectionMeta[] = [
  { key: 'cp', short: 'C/P', full: 'Chemical & Physical Foundations', color: '#4F8EF7' },
  { key: 'cars', short: 'CARS', full: 'Critical Analysis & Reasoning', color: '#00D4FF' },
  { key: 'bb', short: 'B/B', full: 'Biological & Biochemical Foundations', color: '#9B7CFF' },
  { key: 'ps', short: 'P/S', full: 'Psychological, Social & Biological Foundations', color: '#34D399' }
]

export const SECTION_BY_KEY: Record<SectionKey, SectionMeta> = SECTIONS.reduce(
  (acc, s) => ({ ...acc, [s.key]: s }),
  {} as Record<SectionKey, SectionMeta>
)

/** Per-section MCAT scaled score range. */
export const SECTION_SCORE_MIN = 118
export const SECTION_SCORE_MAX = 132
export const TOTAL_SCORE_MIN = 472
export const TOTAL_SCORE_MAX = 528

export type ContentStatus = 'not_started' | 'in_progress' | 'reviewed' | 'mastered'

export const STUDY_RESOURCES = [
  'UWorld',
  'Anki',
  'Khan Academy',
  'Blueprint',
  'AAMC Materials',
  'Jack Westin',
  'Princeton Review',
  'Kaplan',
  'Magoosh'
] as const

export const EXAM_SOURCES = [
  'AAMC FL 1',
  'AAMC FL 2',
  'AAMC FL 3',
  'AAMC FL 4',
  'AAMC Sample',
  'Blueprint',
  'Princeton Review',
  'Kaplan',
  'Altius',
  'Jack Westin'
] as const

// ---------------------------------------------------------------------------
// Records (mirror DB rows; dates are ISO strings 'YYYY-MM-DD' or full ISO)
// ---------------------------------------------------------------------------

export interface User {
  id: number
  firstName: string
  lastName: string
  createdAt: string
}

export interface Settings {
  testDate: string | null
  targetTotal: number
  targetCp: number
  targetCars: number
  targetBb: number
  targetPs: number
  dailyGoalMinutes: number
  theme: 'dark' | 'light'
  notificationsEnabled: boolean
  rememberMe: boolean
  onboarded: boolean
}

export interface StudySession {
  id: number
  date: string // YYYY-MM-DD
  durationMin: number
  section: SectionKey | null
  topic: string | null
  resource: string | null
  notes: string | null
  focus: number // 1-5
  energy: number // 1-5
  createdAt: string
}
export type StudySessionInput = Omit<StudySession, 'id' | 'createdAt'>

export interface ContentTopic {
  id: number
  section: SectionKey
  subject: string
  name: string
  orderIndex: number
}

export interface ContentTopicWithProgress extends ContentTopic {
  status: ContentStatus
  /** Accuracy (0-100) derived from question logs for this topic, or null. */
  accuracy: number | null
  attempted: number
}

export interface QuestionLog {
  id: number
  date: string
  resource: string | null
  section: SectionKey | null
  topic: string | null
  attempted: number
  correct: number
  timeSpentMin: number
  notes: string | null
  createdAt: string
}
export type QuestionLogInput = Omit<QuestionLog, 'id' | 'createdAt'>

export interface Exam {
  id: number
  date: string
  source: string
  scoreCp: number | null
  scoreCars: number | null
  scoreBb: number | null
  scorePs: number | null
  total: number | null
  feeling: number | null // 1-5
  notes: string | null
  createdAt: string
}
export type ExamInput = Omit<Exam, 'id' | 'createdAt'>

export type StudyPhase = 'content' | 'practice' | 'full_length' | 'review'

export interface PlanWeek {
  id: number
  weekIndex: number
  startDate: string
  endDate: string
  phase: StudyPhase
  /** Human-readable focus, e.g. "Biochemistry + CARS". */
  focus: string
  /** Per-section recommended hours for the week. */
  hours: Record<SectionKey, number>
  /** Free-form weekly goals with checkoff. */
  goals: PlanGoal[]
}

export interface PlanGoal {
  id: string
  text: string
  done: boolean
}

export interface Task {
  id: number
  title: string
  dueDate: string // YYYY-MM-DD
  section: SectionKey | null
  type: 'task' | 'deadline'
  completed: boolean
  createdAt: string
}
export type TaskInput = Omit<Task, 'id' | 'createdAt'>

export interface Note {
  id: number
  title: string
  body: string
  section: SectionKey | null
  topic: string | null
  resource: string | null
  tags: string[]
  pinned: boolean
  createdAt: string
  updatedAt: string
}
export type NoteInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>

export interface AnkiLog {
  id: number
  date: string
  deck: string | null
  reviews: number
  newCards: number
  createdAt: string
}
export type AnkiLogInput = Omit<AnkiLog, 'id' | 'createdAt'>

export interface Quote {
  text: string
  author: string
}

// ---------------------------------------------------------------------------
// Derived / analytics shapes
// ---------------------------------------------------------------------------

export interface WeakTopic {
  topic: string
  section: SectionKey
  accuracy: number
  attempted: number
}

export interface SectionAccuracy {
  section: SectionKey
  accuracy: number | null
  attempted: number
  correct: number
}

export interface DashboardSummary {
  todayMinutes: number
  dailyGoalMinutes: number
  streak: number
  daysUntilTest: number | null
  weeklyHours: { label: string; hours: number }[]
  sectionTrends: Record<SectionKey, number[]> // exam scaled scores over time
  weakTopics: WeakTopic[]
  recommendation: string | null
  upcoming: Task[]
}

export interface AnalyticsBundle {
  examTrend: { date: string; cp: number | null; cars: number | null; bb: number | null; ps: number | null; total: number | null }[]
  projectedTotal: number | null
  readinessPct: number
  readinessInsight: string
  studyHoursByWeek: { label: string; hours: number }[]
  topicAccuracy: { topic: string; section: SectionKey; accuracy: number; attempted: number }[]
  resourceTime: { resource: string; minutes: number }[]
  streakCalendar: { date: string; minutes: number }[]
  weakest: WeakTopic[]
  strongest: WeakTopic[]
  sectionAccuracy: SectionAccuracy[]
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthState {
  hasAccount: boolean
  user: User | null
}

export interface SignupInput {
  firstName: string
  lastName: string
  password: string
}

// ---------------------------------------------------------------------------
// The full API surface exposed on window.api (see preload).
// ---------------------------------------------------------------------------

export interface DiscoApi {
  auth: {
    state: () => Promise<AuthState>
    signup: (input: SignupInput) => Promise<User>
    login: (password: string, remember: boolean) => Promise<User | null>
    logout: () => Promise<void>
    /** Returns a user if a "remember me" session is valid. */
    resume: () => Promise<User | null>
  }
  settings: {
    get: () => Promise<Settings>
    update: (patch: Partial<Settings>) => Promise<Settings>
  }
  sessions: {
    list: () => Promise<StudySession[]>
    add: (input: StudySessionInput) => Promise<StudySession>
    remove: (id: number) => Promise<void>
  }
  content: {
    list: () => Promise<ContentTopicWithProgress[]>
    setStatus: (topicId: number, status: ContentStatus) => Promise<void>
  }
  questions: {
    list: () => Promise<QuestionLog[]>
    add: (input: QuestionLogInput) => Promise<QuestionLog>
    remove: (id: number) => Promise<void>
  }
  exams: {
    list: () => Promise<Exam[]>
    add: (input: ExamInput) => Promise<Exam>
    update: (id: number, patch: Partial<ExamInput>) => Promise<Exam>
    remove: (id: number) => Promise<void>
  }
  plan: {
    get: () => Promise<PlanWeek[]>
    generate: () => Promise<PlanWeek[]>
    setGoal: (weekIndex: number, goalId: string, done: boolean) => Promise<void>
  }
  tasks: {
    list: () => Promise<Task[]>
    add: (input: TaskInput) => Promise<Task>
    update: (id: number, patch: Partial<TaskInput>) => Promise<Task>
    remove: (id: number) => Promise<void>
  }
  notes: {
    list: () => Promise<Note[]>
    add: (input: NoteInput) => Promise<Note>
    update: (id: number, patch: Partial<NoteInput>) => Promise<Note>
    remove: (id: number) => Promise<void>
  }
  anki: {
    list: () => Promise<AnkiLog[]>
    add: (input: AnkiLogInput) => Promise<AnkiLog>
    remove: (id: number) => Promise<void>
  }
  dashboard: {
    summary: () => Promise<DashboardSummary>
    quoteOfDay: () => Promise<Quote>
  }
  analytics: {
    bundle: () => Promise<AnalyticsBundle>
  }
  data: {
    exportJson: () => Promise<{ ok: boolean; path?: string }>
    exportCsv: () => Promise<{ ok: boolean; path?: string }>
    reset: () => Promise<void>
  }
  system: {
    notify: (title: string, body: string) => Promise<void>
    version: () => Promise<string>
  }
}
