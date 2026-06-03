import { create } from 'zustand'
import { api } from '@renderer/lib/utils'
import type {
  AnalyticsBundle,
  AnkiLog,
  AnkiLogInput,
  ContentStatus,
  ContentTopicWithProgress,
  DashboardSummary,
  Exam,
  ExamInput,
  Note,
  NoteInput,
  PlanWeek,
  QuestionLog,
  QuestionLogInput,
  Settings,
  StudySession,
  StudySessionInput,
  Task,
  TaskInput
} from '@shared/types'

interface AppState {
  settings: Settings | null
  sessions: StudySession[]
  questions: QuestionLog[]
  exams: Exam[]
  content: ContentTopicWithProgress[]
  plan: PlanWeek[]
  tasks: Task[]
  notes: Note[]
  anki: AnkiLog[]
  dashboard: DashboardSummary | null
  analytics: AnalyticsBundle | null

  loadCore: () => Promise<void>
  refreshDashboard: () => Promise<void>
  refreshAnalytics: () => Promise<void>

  updateSettings: (patch: Partial<Settings>) => Promise<void>

  addSession: (input: StudySessionInput) => Promise<void>
  removeSession: (id: number) => Promise<void>

  addQuestion: (input: QuestionLogInput) => Promise<void>
  removeQuestion: (id: number) => Promise<void>

  setContentStatus: (topicId: number, status: ContentStatus) => Promise<void>

  addExam: (input: ExamInput) => Promise<void>
  updateExam: (id: number, patch: Partial<ExamInput>) => Promise<void>
  removeExam: (id: number) => Promise<void>

  generatePlan: () => Promise<void>
  setPlanGoal: (weekIndex: number, goalId: string, done: boolean) => Promise<void>

  addTask: (input: TaskInput) => Promise<void>
  updateTask: (id: number, patch: Partial<TaskInput>) => Promise<void>
  removeTask: (id: number) => Promise<void>

  addNote: (input: NoteInput) => Promise<Note>
  updateNote: (id: number, patch: Partial<NoteInput>) => Promise<void>
  removeNote: (id: number) => Promise<void>

  addAnki: (input: AnkiLogInput) => Promise<void>
  removeAnki: (id: number) => Promise<void>
}

export const useApp = create<AppState>((set, get) => ({
  settings: null,
  sessions: [],
  questions: [],
  exams: [],
  content: [],
  plan: [],
  tasks: [],
  notes: [],
  anki: [],
  dashboard: null,
  analytics: null,

  // Load everything once after auth. Cheap for a single-user local DB.
  loadCore: async () => {
    const [settings, sessions, questions, exams, content, plan, tasks, notes, anki] =
      await Promise.all([
        api.settings.get(),
        api.sessions.list(),
        api.questions.list(),
        api.exams.list(),
        api.content.list(),
        api.plan.get(),
        api.tasks.list(),
        api.notes.list(),
        api.anki.list()
      ])
    set({ settings, sessions, questions, exams, content, plan, tasks, notes, anki })
    await get().refreshDashboard()
  },

  refreshDashboard: async () => set({ dashboard: await api.dashboard.summary() }),
  refreshAnalytics: async () => set({ analytics: await api.analytics.bundle() }),

  updateSettings: async (patch) => {
    const settings = await api.settings.update(patch)
    set({ settings })
  },

  addSession: async (input) => {
    await api.sessions.add(input)
    set({ sessions: await api.sessions.list() })
    await get().refreshDashboard()
  },
  removeSession: async (id) => {
    await api.sessions.remove(id)
    set({ sessions: await api.sessions.list() })
    await get().refreshDashboard()
  },

  addQuestion: async (input) => {
    await api.questions.add(input)
    const [questions, content] = await Promise.all([api.questions.list(), api.content.list()])
    set({ questions, content })
    await get().refreshDashboard()
  },
  removeQuestion: async (id) => {
    await api.questions.remove(id)
    const [questions, content] = await Promise.all([api.questions.list(), api.content.list()])
    set({ questions, content })
    await get().refreshDashboard()
  },

  setContentStatus: async (topicId, status) => {
    // Optimistic update for snappy checkbox feel.
    set({
      content: get().content.map((t) => (t.id === topicId ? { ...t, status } : t))
    })
    await api.content.setStatus(topicId, status)
  },

  addExam: async (input) => {
    await api.exams.add(input)
    set({ exams: await api.exams.list() })
    await get().refreshDashboard()
  },
  updateExam: async (id, patch) => {
    await api.exams.update(id, patch)
    set({ exams: await api.exams.list() })
  },
  removeExam: async (id) => {
    await api.exams.remove(id)
    set({ exams: await api.exams.list() })
  },

  generatePlan: async () => set({ plan: await api.plan.generate() }),
  setPlanGoal: async (weekIndex, goalId, done) => {
    set({
      plan: get().plan.map((w) =>
        w.weekIndex === weekIndex
          ? { ...w, goals: w.goals.map((g) => (g.id === goalId ? { ...g, done } : g)) }
          : w
      )
    })
    await api.plan.setGoal(weekIndex, goalId, done)
  },

  addTask: async (input) => {
    await api.tasks.add(input)
    set({ tasks: await api.tasks.list() })
    await get().refreshDashboard()
  },
  updateTask: async (id, patch) => {
    await api.tasks.update(id, patch)
    set({ tasks: await api.tasks.list() })
    await get().refreshDashboard()
  },
  removeTask: async (id) => {
    await api.tasks.remove(id)
    set({ tasks: await api.tasks.list() })
    await get().refreshDashboard()
  },

  addNote: async (input) => {
    const note = await api.notes.add(input)
    set({ notes: await api.notes.list() })
    return note
  },
  updateNote: async (id, patch) => {
    await api.notes.update(id, patch)
    set({ notes: await api.notes.list() })
  },
  removeNote: async (id) => {
    await api.notes.remove(id)
    set({ notes: await api.notes.list() })
  },

  addAnki: async (input) => {
    await api.anki.add(input)
    set({ anki: await api.anki.list() })
    await get().refreshDashboard()
  },
  removeAnki: async (id) => {
    await api.anki.remove(id)
    set({ anki: await api.anki.list() })
    await get().refreshDashboard()
  }
}))
