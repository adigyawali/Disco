import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
  subDays,
  subWeeks
} from 'date-fns'
import {
  getPlan,
  getSettings,
  listAnki,
  listContentWithProgress,
  listExams,
  listQuestions,
  listSessions,
  listTasks
} from '../db'
import {
  SECTIONS,
  TOTAL_SCORE_MIN,
  type AnalyticsBundle,
  type DashboardSummary,
  type Quote,
  type SectionAccuracy,
  type SectionKey,
  type WeakTopic
} from '../../shared/types'
import { QUOTES } from '../db/seed-quotes'

const WEAK_THRESHOLD = 60
const MIN_ATTEMPTED = 5
const todayStr = (): string => format(new Date(), 'yyyy-MM-dd')

// ---------------------------------------------------------------------------
// Streak: count of consecutive days (ending today or yesterday) with activity.
// Activity = any study session, question set, or Anki log.
// ---------------------------------------------------------------------------

function activityDates(): Set<string> {
  const dates = new Set<string>()
  for (const s of listSessions()) dates.add(s.date)
  for (const q of listQuestions()) dates.add(q.date)
  for (const a of listAnki()) dates.add(a.date)
  return dates
}

export function computeStreak(): number {
  const dates = activityDates()
  if (dates.size === 0) return 0
  // Start from today; if nothing today, allow starting from yesterday so an
  // in-progress streak isn't shown as 0 before the user logs today.
  let cursor = new Date()
  if (!dates.has(format(cursor, 'yyyy-MM-dd'))) cursor = subDays(cursor, 1)
  let streak = 0
  while (dates.has(format(cursor, 'yyyy-MM-dd'))) {
    streak++
    cursor = subDays(cursor, 1)
  }
  return streak
}

// ---------------------------------------------------------------------------
// Section accuracy + weak/strong topics
// ---------------------------------------------------------------------------

export function sectionAccuracy(): SectionAccuracy[] {
  const totals: Record<string, { attempted: number; correct: number }> = {}
  for (const q of listQuestions()) {
    if (!q.section) continue
    totals[q.section] ??= { attempted: 0, correct: 0 }
    totals[q.section].attempted += q.attempted
    totals[q.section].correct += q.correct
  }
  return SECTIONS.map((s) => {
    const t = totals[s.key]
    return {
      section: s.key,
      attempted: t?.attempted ?? 0,
      correct: t?.correct ?? 0,
      accuracy: t && t.attempted ? Math.round((t.correct / t.attempted) * 100) : null
    }
  })
}

function topicAccuracyList(): WeakTopic[] {
  const totals: Record<string, { section: SectionKey; attempted: number; correct: number }> = {}
  for (const q of listQuestions()) {
    if (!q.topic || !q.section) continue
    totals[q.topic] ??= { section: q.section, attempted: 0, correct: 0 }
    totals[q.topic].attempted += q.attempted
    totals[q.topic].correct += q.correct
  }
  return Object.entries(totals)
    .filter(([, t]) => t.attempted >= MIN_ATTEMPTED)
    .map(([topic, t]) => ({
      topic,
      section: t.section,
      attempted: t.attempted,
      accuracy: Math.round((t.correct / t.attempted) * 100)
    }))
}

export function weakTopics(): WeakTopic[] {
  return topicAccuracyList()
    .filter((t) => t.accuracy < WEAK_THRESHOLD)
    .sort((a, b) => a.accuracy - b.accuracy)
}

// ---------------------------------------------------------------------------
// Score projection + readiness
// ---------------------------------------------------------------------------

function projectedTotal(): number | null {
  const totals = listExams()
    .filter((e) => e.total != null)
    .map((e) => e.total as number)
  if (totals.length === 0) return null
  if (totals.length === 1) return totals[0]
  // Average step between consecutive exams, projected one exam forward.
  let stepSum = 0
  for (let i = 1; i < totals.length; i++) stepSum += totals[i] - totals[i - 1]
  const avgStep = stepSum / (totals.length - 1)
  const projected = Math.round(totals[totals.length - 1] + avgStep)
  return Math.max(TOTAL_SCORE_MIN, Math.min(528, projected))
}

function contentCompletionPct(): number {
  const topics = listContentWithProgress()
  if (topics.length === 0) return 0
  const weight: Record<string, number> = {
    not_started: 0,
    in_progress: 0.4,
    reviewed: 0.8,
    mastered: 1
  }
  const sum = topics.reduce((acc, t) => acc + (weight[t.status] ?? 0), 0)
  return Math.round((sum / topics.length) * 100)
}

function avgAccuracy(): number | null {
  const secs = sectionAccuracy().filter((s) => s.accuracy != null)
  if (secs.length === 0) return null
  return Math.round(secs.reduce((a, s) => a + (s.accuracy as number), 0) / secs.length)
}

function readiness(): { pct: number; insight: string } {
  const settings = getSettings()
  const content = contentCompletionPct()
  const acc = avgAccuracy()
  const projected = projectedTotal()

  let pct: number
  if (projected != null) {
    const scoreProgress = Math.max(
      0,
      Math.min(100, ((projected - TOTAL_SCORE_MIN) / (settings.targetTotal - TOTAL_SCORE_MIN)) * 100)
    )
    pct = Math.round(0.4 * scoreProgress + 0.35 * content + 0.25 * (acc ?? 0))
  } else {
    // No full-lengths yet — base readiness on content + accuracy only.
    pct = Math.round(0.6 * content + 0.4 * (acc ?? 0))
  }
  pct = Math.max(0, Math.min(100, pct))

  let insight: string
  if (projected == null) {
    insight = `Log a full-length to unlock a score projection. You've reviewed ${content}% of content so far.`
  } else if (projected >= settings.targetTotal) {
    insight = `You're on track for a ${projected}+ if you maintain this trajectory — at or above your ${settings.targetTotal} target.`
  } else {
    const gap = settings.targetTotal - projected
    insight = `Projected ${projected}, about ${gap} point${gap === 1 ? '' : 's'} from your ${settings.targetTotal} target. Keep pushing your weak sections.`
  }
  return { pct, insight }
}

// ---------------------------------------------------------------------------
// Time series helpers
// ---------------------------------------------------------------------------

function last7DayHours(): { label: string; hours: number }[] {
  const sessions = listSessions()
  const out: { label: string; hours: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i)
    const key = format(d, 'yyyy-MM-dd')
    const mins = sessions.filter((s) => s.date === key).reduce((a, s) => a + s.durationMin, 0)
    out.push({ label: format(d, 'EEE'), hours: Math.round((mins / 60) * 10) / 10 })
  }
  return out
}

function studyHoursByWeek(weeks = 8): { label: string; hours: number }[] {
  const sessions = listSessions()
  const out: { label: string; hours: number }[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 6)
    const mins = sessions
      .filter((s) => {
        const d = parseISO(s.date)
        return d >= weekStart && d <= addDays(weekEnd, 1)
      })
      .reduce((a, s) => a + s.durationMin, 0)
    out.push({ label: format(weekStart, 'MMM d'), hours: Math.round((mins / 60) * 10) / 10 })
  }
  return out
}

function sectionTrends(): Record<SectionKey, number[]> {
  const exams = listExams()
  const trends = {} as Record<SectionKey, number[]>
  trends.cp = exams.map((e) => e.scoreCp).filter((v): v is number => v != null)
  trends.cars = exams.map((e) => e.scoreCars).filter((v): v is number => v != null)
  trends.bb = exams.map((e) => e.scoreBb).filter((v): v is number => v != null)
  trends.ps = exams.map((e) => e.scorePs).filter((v): v is number => v != null)
  return trends
}

// ---------------------------------------------------------------------------
// Public aggregates
// ---------------------------------------------------------------------------

export function dashboardSummary(): DashboardSummary {
  const settings = getSettings()
  const today = todayStr()
  const todayMinutes = listSessions()
    .filter((s) => s.date === today)
    .reduce((a, s) => a + s.durationMin, 0)

  const daysUntilTest = settings.testDate
    ? Math.max(0, differenceInCalendarDays(parseISO(settings.testDate), new Date()))
    : null

  const weak = weakTopics()
  const recommendation = weak.length
    ? `Based on recent performance, focus on ${weak[0].topic} (${weak[0].accuracy}% accuracy).`
    : 'Great work — no weak topics flagged. Keep logging practice to refine recommendations.'

  const upcoming = listTasks()
    .filter((t) => !t.completed && t.dueDate >= today)
    .slice(0, 5)

  return {
    todayMinutes,
    dailyGoalMinutes: settings.dailyGoalMinutes,
    streak: computeStreak(),
    daysUntilTest,
    weeklyHours: last7DayHours(),
    sectionTrends: sectionTrends(),
    weakTopics: weak.slice(0, 4),
    recommendation,
    upcoming
  }
}

export function quoteOfDay(): Quote {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000)
  return QUOTES[dayOfYear % QUOTES.length]
}

export function analyticsBundle(): AnalyticsBundle {
  const exams = listExams()
  const examTrend = exams.map((e) => ({
    date: e.date,
    cp: e.scoreCp,
    cars: e.scoreCars,
    bb: e.scoreBb,
    ps: e.scorePs,
    total: e.total
  }))

  const topics = topicAccuracyList().sort((a, b) => b.accuracy - a.accuracy)
  const { pct, insight } = readiness()

  // Resource time from study sessions (minutes per resource).
  const resourceMap: Record<string, number> = {}
  for (const s of listSessions()) {
    const r = s.resource ?? 'Other'
    resourceMap[r] = (resourceMap[r] ?? 0) + s.durationMin
  }
  const resourceTime = Object.entries(resourceMap)
    .map(([resource, minutes]) => ({ resource, minutes }))
    .sort((a, b) => b.minutes - a.minutes)

  // Streak calendar: last ~119 days (17 weeks) of total study minutes per day.
  const sessions = listSessions()
  const streakCalendar: { date: string; minutes: number }[] = []
  for (let i = 118; i >= 0; i--) {
    const key = format(subDays(new Date(), i), 'yyyy-MM-dd')
    const minutes = sessions.filter((s) => s.date === key).reduce((a, s) => a + s.durationMin, 0)
    streakCalendar.push({ date: key, minutes })
  }

  return {
    examTrend,
    projectedTotal: projectedTotal(),
    readinessPct: pct,
    readinessInsight: insight,
    studyHoursByWeek: studyHoursByWeek(),
    topicAccuracy: topics,
    resourceTime,
    streakCalendar,
    weakest: topics.slice().reverse().slice(0, 6),
    strongest: topics.slice(0, 6),
    sectionAccuracy: sectionAccuracy()
  }
}

// Re-export for the plan generator.
export { contentCompletionPct }
export { getPlan }
