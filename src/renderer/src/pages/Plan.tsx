import { motion } from 'framer-motion'
import { Check, RefreshCw, Route, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { PageHeader, EmptyState } from '@renderer/components/ui/Misc'
import { Card } from '@renderer/components/ui/Card'
import { Button } from '@renderer/components/ui/Button'
import { useApp } from '@renderer/stores/app'
import { cn, fmtDate } from '@renderer/lib/utils'
import { SECTIONS, type StudyPhase } from '@shared/types'

const PHASE_META: Record<StudyPhase, { label: string; color: string; desc: string }> = {
  content: { label: 'Content', color: 'rgb(var(--accent))', desc: 'Build your foundation' },
  practice: { label: 'Practice', color: 'rgb(var(--violet))', desc: 'Apply with questions' },
  full_length: { label: 'Full-Lengths', color: 'rgb(var(--accent-2))', desc: 'Build stamina' },
  review: { label: 'Final Review', color: 'rgb(var(--success))', desc: 'Sharpen & taper' }
}

export function Plan(): JSX.Element {
  const plan = useApp((s) => s.plan)
  const generate = useApp((s) => s.generatePlan)
  const setGoal = useApp((s) => s.setPlanGoal)
  const [busy, setBusy] = useState(false)

  const regenerate = async (): Promise<void> => {
    setBusy(true)
    await generate()
    setBusy(false)
  }

  const totalGoals = plan.reduce((a, w) => a + w.goals.length, 0)
  const doneGoals = plan.reduce((a, w) => a + w.goals.filter((g) => g.done).length, 0)

  return (
    <div>
      <PageHeader
        title="Study Plan"
        subtitle={
          plan.length
            ? `${plan.length}-week plan · ${doneGoals}/${totalGoals} goals complete · auto-weighted to your weak sections.`
            : 'Generate a phased plan tuned to your test date and performance.'
        }
        actions={
          <Button onClick={regenerate} disabled={busy}>
            <RefreshCw size={16} className={busy ? 'animate-spin' : ''} /> {plan.length ? 'Regenerate' : 'Generate Plan'}
          </Button>
        }
      />

      {plan.length === 0 ? (
        <EmptyState
          icon={<Route size={40} />}
          title="No plan yet"
          hint="Generate a smart, phased study plan. It re-weights toward your weakest sections every time you regenerate."
          action={<Button onClick={regenerate}><Sparkles size={16} /> Generate Plan</Button>}
        />
      ) : (
        <div className="relative space-y-4 pl-6">
          {/* Timeline rail */}
          <div className="absolute bottom-2 left-2 top-2 w-px bg-border" />
          {plan.map((week, i) => {
            const meta = PHASE_META[week.phase]
            const weekDone = week.goals.length > 0 && week.goals.every((g) => g.done)
            return (
              <motion.div
                key={week.weekIndex}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="relative"
              >
                {/* Node */}
                <span
                  className="absolute -left-[18px] top-5 grid h-3.5 w-3.5 place-items-center rounded-full ring-4 ring-bg"
                  style={{ background: meta.color }}
                />
                <Card className="p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-content-subtle">Week {week.weekIndex + 1}</span>
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                        style={{ background: meta.color }}
                      >
                        {meta.label}
                      </span>
                      {weekDone && (
                        <span className="chip bg-success/15 text-success">
                          <Check size={12} /> Done
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-content-subtle">
                      {fmtDate(week.startDate)} – {fmtDate(week.endDate)}
                    </span>
                  </div>

                  <div className="grid gap-5 md:grid-cols-[1fr_auto]">
                    <div className="space-y-2">
                      {week.goals.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setGoal(week.weekIndex, g.id, !g.done)}
                          className="flex w-full items-center gap-3 text-left"
                        >
                          <span
                            className={cn(
                              'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all',
                              g.done ? 'border-transparent bg-accent-gradient' : 'border-border-strong'
                            )}
                          >
                            {g.done && <Check size={13} className="text-white" />}
                          </span>
                          <span className={cn('text-sm', g.done && 'text-content-subtle line-through')}>
                            {g.text}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Per-section hour allocation */}
                    <div className="min-w-[160px] rounded-xl bg-surface-2/50 p-3">
                      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-content-subtle">
                        Weekly hours
                      </p>
                      {SECTIONS.map((s) => (
                        <div key={s.key} className="flex items-center justify-between py-0.5 text-sm">
                          <span style={{ color: s.color }} className="font-medium">{s.short}</span>
                          <span className="font-bold">{week.hours[s.key]}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
