import { addDays, differenceInCalendarDays, format, nextMonday, parseISO } from 'date-fns'
import { getSettings, listContentWithProgress, replacePlan } from '../db'
import { sectionAccuracy } from './analytics'
import { SECTION_BY_KEY, SECTIONS, type PlanGoal, type PlanWeek, type SectionKey, type StudyPhase } from '../../shared/types'

const DEFAULT_WEEKS = 12

/** Per-section content completion fraction (0-1), weighting status levels. */
function contentCompletionBySection(): Record<SectionKey, number> {
  const weight: Record<string, number> = { not_started: 0, in_progress: 0.4, reviewed: 0.8, mastered: 1 }
  const totals: Record<string, { sum: number; count: number }> = {}
  for (const t of listContentWithProgress()) {
    totals[t.section] ??= { sum: 0, count: 0 }
    totals[t.section].sum += weight[t.status] ?? 0
    totals[t.section].count += 1
  }
  const out = {} as Record<SectionKey, number>
  for (const s of SECTIONS) {
    const t = totals[s.key]
    out[s.key] = t && t.count ? t.sum / t.count : 0
  }
  return out
}

/**
 * Weight each section by where the student needs the most work.
 * Lower accuracy and lower content completion => higher weight => more hours.
 * Sections with no data get a moderate default so they aren't ignored.
 */
function sectionWeights(): Record<SectionKey, number> {
  const acc = sectionAccuracy()
  const content = contentCompletionBySection()
  const weights = {} as Record<SectionKey, number>
  for (const s of SECTIONS) {
    const a = acc.find((x) => x.section === s.key)
    const accFactor = a?.accuracy != null ? 1 - a.accuracy / 100 : 0.5
    const contentFactor = 1 - content[s.key]
    weights[s.key] = 1 + accFactor * 1.5 + contentFactor * 1.0
  }
  return weights
}

function phaseForProgress(p: number): StudyPhase {
  if (p < 0.45) return 'content'
  if (p < 0.7) return 'practice'
  if (p < 0.9) return 'full_length'
  return 'review'
}

function focusLabel(weights: Record<SectionKey, number>): string {
  const top = SECTIONS.slice()
    .sort((a, b) => weights[b.key] - weights[a.key])
    .slice(0, 2)
    .map((s) => SECTION_BY_KEY[s.key].short)
  return top.join(' + ')
}

function goalsForPhase(phase: StudyPhase, weekIndex: number, weights: Record<SectionKey, number>): PlanGoal[] {
  const topSection = SECTIONS.slice().sort((a, b) => weights[b.key] - weights[a.key])[0]
  const topShort = SECTION_BY_KEY[topSection.key].short
  const id = (n: number): string => `w${weekIndex}-g${n}`
  const templates: Record<StudyPhase, string[]> = {
    content: [
      `Finish content review for high-yield ${topShort} topics`,
      'Make Anki cards for every new concept',
      'Log at least one focused study session daily',
      'Do 1 discrete question set to apply new content'
    ],
    practice: [
      `Complete 2 UWorld blocks weighted toward ${topShort}`,
      'Review every missed question and note the pattern',
      'Daily CARS passage practice (timed)',
      'Update content checklist based on weak areas'
    ],
    full_length: [
      'Take one full-length under realistic conditions',
      'Spend a full day reviewing the FL thoroughly',
      `Targeted remediation on ${topShort} from FL review`,
      'Maintain daily Anki reviews'
    ],
    review: [
      'Light targeted review of flagged weak topics only',
      'Review high-yield formula & concept sheets',
      'One final timed CARS set',
      'Rest, logistics check, and taper — protect your sleep'
    ]
  }
  return templates[phase].map((text, i) => ({ id: id(i), text, done: false }))
}

export function generatePlan(): PlanWeek[] {
  const settings = getSettings()
  const start = nextMonday(new Date())

  let weeks = DEFAULT_WEEKS
  if (settings.testDate) {
    const days = differenceInCalendarDays(parseISO(settings.testDate), start)
    weeks = Math.max(1, Math.min(52, Math.ceil(days / 7)))
  }

  const weights = sectionWeights()
  const weeklyHours = (settings.dailyGoalMinutes * 7) / 60

  const plan: PlanWeek[] = []
  for (let i = 0; i < weeks; i++) {
    const weekStart = addDays(start, i * 7)
    const weekEnd = addDays(weekStart, 6)
    const phase = phaseForProgress(weeks === 1 ? 0 : i / (weeks - 1))

    // Distribute the week's hours across sections by weight.
    const totalWeight = SECTIONS.reduce((a, s) => a + weights[s.key], 0)
    const hours = {} as Record<SectionKey, number>
    for (const s of SECTIONS) {
      hours[s.key] = Math.round((weights[s.key] / totalWeight) * weeklyHours * 10) / 10
    }

    plan.push({
      id: i,
      weekIndex: i,
      startDate: format(weekStart, 'yyyy-MM-dd'),
      endDate: format(weekEnd, 'yyyy-MM-dd'),
      phase,
      focus: focusLabel(weights),
      hours,
      goals: goalsForPhase(phase, i, weights)
    })
  }

  return replacePlan(plan)
}
