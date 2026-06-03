import Database from 'better-sqlite3'
import { SCHEMA_SQL } from './schema'
import { SEED_TOPICS } from './seed-content'
import type {
  AnkiLog,
  AnkiLogInput,
  ContentStatus,
  ContentTopicWithProgress,
  Exam,
  ExamInput,
  Note,
  NoteInput,
  PlanGoal,
  PlanWeek,
  QuestionLog,
  QuestionLogInput,
  SectionKey,
  Settings,
  StudySession,
  StudySessionInput,
  Task,
  TaskInput,
  User
} from '../../shared/types'

let db: Database.Database

const nowIso = (): string => new Date().toISOString()

// ---------------------------------------------------------------------------
// Init + seed
// ---------------------------------------------------------------------------

export function initDb(dbPath: string): void {
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.exec(SCHEMA_SQL)
  ensureSettingsRow()
  seedContentTopics()
}

function ensureSettingsRow(): void {
  const row = db.prepare('SELECT id FROM settings WHERE id = 1').get()
  if (!row) {
    db.prepare('INSERT INTO settings (id) VALUES (1)').run()
  }
}

function seedContentTopics(): void {
  const count = (db.prepare('SELECT COUNT(*) AS n FROM content_topics').get() as { n: number }).n
  if (count > 0) return
  const insert = db.prepare(
    'INSERT INTO content_topics (section, subject, name, order_index) VALUES (?, ?, ?, ?)'
  )
  const tx = db.transaction(() => {
    SEED_TOPICS.forEach((t, i) => insert.run(t.section, t.subject, t.name, i))
  })
  tx()
}

// ---------------------------------------------------------------------------
// Auth / users
// ---------------------------------------------------------------------------

interface UserRow {
  id: number
  first_name: string
  last_name: string
  password_hash: string
  created_at: string
}

const mapUser = (r: UserRow): User => ({
  id: r.id,
  firstName: r.first_name,
  lastName: r.last_name,
  createdAt: r.created_at
})

export function getUserRow(): UserRow | undefined {
  return db.prepare('SELECT * FROM users ORDER BY id LIMIT 1').get() as UserRow | undefined
}

export function getUser(): User | null {
  const r = getUserRow()
  return r ? mapUser(r) : null
}

export function createUser(firstName: string, lastName: string, passwordHash: string): User {
  const info = db
    .prepare(
      'INSERT INTO users (first_name, last_name, password_hash, created_at) VALUES (?, ?, ?, ?)'
    )
    .run(firstName, lastName, passwordHash, nowIso())
  return mapUser(getUserRowById(info.lastInsertRowid as number))
}

function getUserRowById(id: number): UserRow {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

interface SettingsRow {
  test_date: string | null
  target_total: number
  target_cp: number
  target_cars: number
  target_bb: number
  target_ps: number
  daily_goal_minutes: number
  theme: 'dark' | 'light'
  notifications_enabled: number
  remember_me: number
  onboarded: number
}

const mapSettings = (r: SettingsRow): Settings => ({
  testDate: r.test_date,
  targetTotal: r.target_total,
  targetCp: r.target_cp,
  targetCars: r.target_cars,
  targetBb: r.target_bb,
  targetPs: r.target_ps,
  dailyGoalMinutes: r.daily_goal_minutes,
  theme: r.theme,
  notificationsEnabled: !!r.notifications_enabled,
  rememberMe: !!r.remember_me,
  onboarded: !!r.onboarded
})

export function getSettings(): Settings {
  return mapSettings(db.prepare('SELECT * FROM settings WHERE id = 1').get() as SettingsRow)
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const map: Record<string, string> = {
    testDate: 'test_date',
    targetTotal: 'target_total',
    targetCp: 'target_cp',
    targetCars: 'target_cars',
    targetBb: 'target_bb',
    targetPs: 'target_ps',
    dailyGoalMinutes: 'daily_goal_minutes',
    theme: 'theme',
    notificationsEnabled: 'notifications_enabled',
    rememberMe: 'remember_me',
    onboarded: 'onboarded'
  }
  const sets: string[] = []
  const vals: unknown[] = []
  for (const [k, v] of Object.entries(patch)) {
    const col = map[k]
    if (!col) continue
    sets.push(`${col} = ?`)
    vals.push(typeof v === 'boolean' ? (v ? 1 : 0) : v)
  }
  if (sets.length) {
    db.prepare(`UPDATE settings SET ${sets.join(', ')} WHERE id = 1`).run(...vals)
  }
  return getSettings()
}

// ---------------------------------------------------------------------------
// Study sessions
// ---------------------------------------------------------------------------

interface SessionRow {
  id: number
  date: string
  duration_min: number
  section: string | null
  topic: string | null
  resource: string | null
  notes: string | null
  focus: number
  energy: number
  created_at: string
}

const mapSession = (r: SessionRow): StudySession => ({
  id: r.id,
  date: r.date,
  durationMin: r.duration_min,
  section: r.section as SectionKey | null,
  topic: r.topic,
  resource: r.resource,
  notes: r.notes,
  focus: r.focus,
  energy: r.energy,
  createdAt: r.created_at
})

export function listSessions(): StudySession[] {
  return (db.prepare('SELECT * FROM study_sessions ORDER BY date DESC, id DESC').all() as SessionRow[]).map(
    mapSession
  )
}

export function addSession(input: StudySessionInput): StudySession {
  const info = db
    .prepare(
      `INSERT INTO study_sessions (date, duration_min, section, topic, resource, notes, focus, energy, created_at)
       VALUES (@date, @durationMin, @section, @topic, @resource, @notes, @focus, @energy, @createdAt)`
    )
    .run({ ...input, createdAt: nowIso() })
  return mapSession(
    db.prepare('SELECT * FROM study_sessions WHERE id = ?').get(info.lastInsertRowid) as SessionRow
  )
}

export function removeSession(id: number): void {
  db.prepare('DELETE FROM study_sessions WHERE id = ?').run(id)
}

// ---------------------------------------------------------------------------
// Content review + progress (joined with question accuracy)
// ---------------------------------------------------------------------------

export function listContentWithProgress(): ContentTopicWithProgress[] {
  const rows = db
    .prepare(
      `SELECT t.id, t.section, t.subject, t.name, t.order_index AS orderIndex,
              COALESCE(p.status, 'not_started') AS status,
              q.attempted AS attempted, q.correct AS correct
       FROM content_topics t
       LEFT JOIN content_progress p ON p.topic_id = t.id
       LEFT JOIN (
         SELECT topic, SUM(attempted) AS attempted, SUM(correct) AS correct
         FROM question_logs WHERE topic IS NOT NULL GROUP BY topic
       ) q ON q.topic = t.name
       ORDER BY t.section, t.subject, t.order_index`
    )
    .all() as Array<{
    id: number
    section: SectionKey
    subject: string
    name: string
    orderIndex: number
    status: ContentStatus
    attempted: number | null
    correct: number | null
  }>
  return rows.map((r) => ({
    id: r.id,
    section: r.section,
    subject: r.subject,
    name: r.name,
    orderIndex: r.orderIndex,
    status: r.status,
    attempted: r.attempted ?? 0,
    accuracy: r.attempted ? Math.round(((r.correct ?? 0) / r.attempted) * 100) : null
  }))
}

export function setContentStatus(topicId: number, status: ContentStatus): void {
  db.prepare(
    `INSERT INTO content_progress (topic_id, status, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(topic_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`
  ).run(topicId, status, nowIso())
}

// ---------------------------------------------------------------------------
// Question logs
// ---------------------------------------------------------------------------

interface QuestionRow {
  id: number
  date: string
  resource: string | null
  section: string | null
  topic: string | null
  attempted: number
  correct: number
  time_spent_min: number
  notes: string | null
  created_at: string
}

const mapQuestion = (r: QuestionRow): QuestionLog => ({
  id: r.id,
  date: r.date,
  resource: r.resource,
  section: r.section as SectionKey | null,
  topic: r.topic,
  attempted: r.attempted,
  correct: r.correct,
  timeSpentMin: r.time_spent_min,
  notes: r.notes,
  createdAt: r.created_at
})

export function listQuestions(): QuestionLog[] {
  return (
    db.prepare('SELECT * FROM question_logs ORDER BY date DESC, id DESC').all() as QuestionRow[]
  ).map(mapQuestion)
}

export function addQuestion(input: QuestionLogInput): QuestionLog {
  const info = db
    .prepare(
      `INSERT INTO question_logs (date, resource, section, topic, attempted, correct, time_spent_min, notes, created_at)
       VALUES (@date, @resource, @section, @topic, @attempted, @correct, @timeSpentMin, @notes, @createdAt)`
    )
    .run({ ...input, createdAt: nowIso() })
  return mapQuestion(
    db.prepare('SELECT * FROM question_logs WHERE id = ?').get(info.lastInsertRowid) as QuestionRow
  )
}

export function removeQuestion(id: number): void {
  db.prepare('DELETE FROM question_logs WHERE id = ?').run(id)
}

// ---------------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------------

interface ExamRow {
  id: number
  date: string
  source: string
  score_cp: number | null
  score_cars: number | null
  score_bb: number | null
  score_ps: number | null
  total: number | null
  feeling: number | null
  notes: string | null
  created_at: string
}

const mapExam = (r: ExamRow): Exam => ({
  id: r.id,
  date: r.date,
  source: r.source,
  scoreCp: r.score_cp,
  scoreCars: r.score_cars,
  scoreBb: r.score_bb,
  scorePs: r.score_ps,
  total: r.total,
  feeling: r.feeling,
  notes: r.notes,
  createdAt: r.created_at
})

export function listExams(): Exam[] {
  return (db.prepare('SELECT * FROM exams ORDER BY date ASC, id ASC').all() as ExamRow[]).map(mapExam)
}

export function addExam(input: ExamInput): Exam {
  const info = db
    .prepare(
      `INSERT INTO exams (date, source, score_cp, score_cars, score_bb, score_ps, total, feeling, notes, created_at)
       VALUES (@date, @source, @scoreCp, @scoreCars, @scoreBb, @scorePs, @total, @feeling, @notes, @createdAt)`
    )
    .run({ ...input, createdAt: nowIso() })
  return mapExam(db.prepare('SELECT * FROM exams WHERE id = ?').get(info.lastInsertRowid) as ExamRow)
}

export function updateExam(id: number, patch: Partial<ExamInput>): Exam {
  const map: Record<string, string> = {
    date: 'date',
    source: 'source',
    scoreCp: 'score_cp',
    scoreCars: 'score_cars',
    scoreBb: 'score_bb',
    scorePs: 'score_ps',
    total: 'total',
    feeling: 'feeling',
    notes: 'notes'
  }
  const sets: string[] = []
  const vals: unknown[] = []
  for (const [k, v] of Object.entries(patch)) {
    if (!map[k]) continue
    sets.push(`${map[k]} = ?`)
    vals.push(v)
  }
  if (sets.length) {
    vals.push(id)
    db.prepare(`UPDATE exams SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  }
  return mapExam(db.prepare('SELECT * FROM exams WHERE id = ?').get(id) as ExamRow)
}

export function removeExam(id: number): void {
  db.prepare('DELETE FROM exams WHERE id = ?').run(id)
}

// ---------------------------------------------------------------------------
// Study plan
// ---------------------------------------------------------------------------

interface PlanRow {
  week_index: number
  start_date: string
  end_date: string
  phase: string
  focus: string
  hours: string
  goals: string
}

const mapPlan = (r: PlanRow): PlanWeek => ({
  weekIndex: r.week_index,
  startDate: r.start_date,
  endDate: r.end_date,
  phase: r.phase as PlanWeek['phase'],
  focus: r.focus,
  hours: JSON.parse(r.hours),
  goals: JSON.parse(r.goals),
  id: r.week_index
})

export function getPlan(): PlanWeek[] {
  return (db.prepare('SELECT * FROM plan_weeks ORDER BY week_index ASC').all() as PlanRow[]).map(
    mapPlan
  )
}

export function replacePlan(weeks: PlanWeek[]): PlanWeek[] {
  const insert = db.prepare(
    `INSERT INTO plan_weeks (week_index, start_date, end_date, phase, focus, hours, goals)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM plan_weeks').run()
    for (const w of weeks) {
      insert.run(
        w.weekIndex,
        w.startDate,
        w.endDate,
        w.phase,
        w.focus,
        JSON.stringify(w.hours),
        JSON.stringify(w.goals)
      )
    }
  })
  tx()
  return getPlan()
}

export function setPlanGoal(weekIndex: number, goalId: string, done: boolean): void {
  const row = db.prepare('SELECT goals FROM plan_weeks WHERE week_index = ?').get(weekIndex) as
    | { goals: string }
    | undefined
  if (!row) return
  const goals: PlanGoal[] = JSON.parse(row.goals)
  const goal = goals.find((g) => g.id === goalId)
  if (goal) goal.done = done
  db.prepare('UPDATE plan_weeks SET goals = ? WHERE week_index = ?').run(
    JSON.stringify(goals),
    weekIndex
  )
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

interface TaskRow {
  id: number
  title: string
  due_date: string
  section: string | null
  type: 'task' | 'deadline'
  completed: number
  created_at: string
}

const mapTask = (r: TaskRow): Task => ({
  id: r.id,
  title: r.title,
  dueDate: r.due_date,
  section: r.section as SectionKey | null,
  type: r.type,
  completed: !!r.completed,
  createdAt: r.created_at
})

export function listTasks(): Task[] {
  return (db.prepare('SELECT * FROM tasks ORDER BY due_date ASC, id ASC').all() as TaskRow[]).map(
    mapTask
  )
}

export function addTask(input: TaskInput): Task {
  const info = db
    .prepare(
      `INSERT INTO tasks (title, due_date, section, type, completed, created_at)
       VALUES (@title, @dueDate, @section, @type, @completed, @createdAt)`
    )
    .run({ ...input, completed: input.completed ? 1 : 0, createdAt: nowIso() })
  return mapTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid) as TaskRow)
}

export function updateTask(id: number, patch: Partial<TaskInput>): Task {
  const map: Record<string, string> = {
    title: 'title',
    dueDate: 'due_date',
    section: 'section',
    type: 'type',
    completed: 'completed'
  }
  const sets: string[] = []
  const vals: unknown[] = []
  for (const [k, v] of Object.entries(patch)) {
    if (!map[k]) continue
    sets.push(`${map[k]} = ?`)
    vals.push(typeof v === 'boolean' ? (v ? 1 : 0) : v)
  }
  if (sets.length) {
    vals.push(id)
    db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  }
  return mapTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow)
}

export function removeTask(id: number): void {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

interface NoteRow {
  id: number
  title: string
  body: string
  section: string | null
  topic: string | null
  resource: string | null
  tags: string
  pinned: number
  created_at: string
  updated_at: string
}

const mapNote = (r: NoteRow): Note => ({
  id: r.id,
  title: r.title,
  body: r.body,
  section: r.section as SectionKey | null,
  topic: r.topic,
  resource: r.resource,
  tags: JSON.parse(r.tags),
  pinned: !!r.pinned,
  createdAt: r.created_at,
  updatedAt: r.updated_at
})

export function listNotes(): Note[] {
  return (
    db.prepare('SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC').all() as NoteRow[]
  ).map(mapNote)
}

export function addNote(input: NoteInput): Note {
  const ts = nowIso()
  const info = db
    .prepare(
      `INSERT INTO notes (title, body, section, topic, resource, tags, pinned, created_at, updated_at)
       VALUES (@title, @body, @section, @topic, @resource, @tags, @pinned, @createdAt, @updatedAt)`
    )
    .run({
      ...input,
      tags: JSON.stringify(input.tags ?? []),
      pinned: input.pinned ? 1 : 0,
      createdAt: ts,
      updatedAt: ts
    })
  return mapNote(db.prepare('SELECT * FROM notes WHERE id = ?').get(info.lastInsertRowid) as NoteRow)
}

export function updateNote(id: number, patch: Partial<NoteInput>): Note {
  const map: Record<string, string> = {
    title: 'title',
    body: 'body',
    section: 'section',
    topic: 'topic',
    resource: 'resource',
    tags: 'tags',
    pinned: 'pinned'
  }
  const sets: string[] = ['updated_at = ?']
  const vals: unknown[] = [nowIso()]
  for (const [k, v] of Object.entries(patch)) {
    if (!map[k]) continue
    sets.push(`${map[k]} = ?`)
    if (k === 'tags') vals.push(JSON.stringify(v))
    else if (k === 'pinned') vals.push(v ? 1 : 0)
    else vals.push(v)
  }
  vals.push(id)
  db.prepare(`UPDATE notes SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  return mapNote(db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as NoteRow)
}

export function removeNote(id: number): void {
  db.prepare('DELETE FROM notes WHERE id = ?').run(id)
}

// ---------------------------------------------------------------------------
// Anki logs
// ---------------------------------------------------------------------------

interface AnkiRow {
  id: number
  date: string
  deck: string | null
  reviews: number
  new_cards: number
  created_at: string
}

const mapAnki = (r: AnkiRow): AnkiLog => ({
  id: r.id,
  date: r.date,
  deck: r.deck,
  reviews: r.reviews,
  newCards: r.new_cards,
  createdAt: r.created_at
})

export function listAnki(): AnkiLog[] {
  return (db.prepare('SELECT * FROM anki_logs ORDER BY date DESC, id DESC').all() as AnkiRow[]).map(
    mapAnki
  )
}

export function addAnki(input: AnkiLogInput): AnkiLog {
  const info = db
    .prepare(
      `INSERT INTO anki_logs (date, deck, reviews, new_cards, created_at)
       VALUES (@date, @deck, @reviews, @newCards, @createdAt)`
    )
    .run({ ...input, createdAt: nowIso() })
  return mapAnki(db.prepare('SELECT * FROM anki_logs WHERE id = ?').get(info.lastInsertRowid) as AnkiRow)
}

export function removeAnki(id: number): void {
  db.prepare('DELETE FROM anki_logs WHERE id = ?').run(id)
}

// ---------------------------------------------------------------------------
// Bulk export / reset
// ---------------------------------------------------------------------------

export function exportAll(): Record<string, unknown[]> {
  return {
    sessions: listSessions(),
    questions: listQuestions(),
    exams: listExams(),
    tasks: listTasks(),
    notes: listNotes(),
    anki: listAnki(),
    plan: getPlan(),
    content: listContentWithProgress()
  }
}

/** Wipes all user-entered data but keeps the account, settings, and content outline. */
export function resetData(): void {
  const tx = db.transaction(() => {
    db.exec(`
      DELETE FROM study_sessions;
      DELETE FROM question_logs;
      DELETE FROM exams;
      DELETE FROM tasks;
      DELETE FROM notes;
      DELETE FROM anki_logs;
      DELETE FROM plan_weeks;
      DELETE FROM content_progress;
    `)
  })
  tx()
}

export function getDb(): Database.Database {
  return db
}
