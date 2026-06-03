import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis
} from 'recharts'
import {
  BookOpenCheck,
  CalendarClock,
  Flame,
  GraduationCap,
  Lightbulb,
  Quote as QuoteIcon,
  Target,
  TrendingUp
} from 'lucide-react'
import { Card, CardTitle } from '@renderer/components/ui/Card'
import { ProgressRing } from '@renderer/components/ui/ProgressRing'
import { CountUp } from '@renderer/components/ui/CountUp'
import { SectionTag } from '@renderer/components/ui/Misc'
import { useApp } from '@renderer/stores/app'
import { useAuth } from '@renderer/stores/auth'
import { useUI } from '@renderer/stores/ui'
import { fmtDate, fmtDuration, greeting } from '@renderer/lib/utils'
import { SECTIONS, type Quote } from '@shared/types'

export function Dashboard(): JSX.Element {
  const user = useAuth((s) => s.user)
  const dashboard = useApp((s) => s.dashboard)
  const refreshDashboard = useApp((s) => s.refreshDashboard)
  const openQuickAdd = useUI((s) => s.openQuickAdd)
  const [quote, setQuote] = useState<Quote | null>(null)

  useEffect(() => {
    void refreshDashboard()
    void window.api.dashboard.quoteOfDay().then(setQuote)
  }, [refreshDashboard])

  if (!dashboard) return <div className="h-40" />

  const goalPct =
    dashboard.dailyGoalMinutes > 0
      ? Math.round((dashboard.todayMinutes / dashboard.dailyGoalMinutes) * 100)
      : 0

  const now = new Date()

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          {greeting()}, {user?.firstName ?? 'there'}
        </motion.h1>
        <p className="mt-1 text-sm text-content-muted">
          {now.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Hero row: goal ring, streak, countdown */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="flex items-center gap-5">
          <ProgressRing value={goalPct} size={132}>
            <span className="text-3xl font-bold">
              <CountUp value={Math.min(goalPct, 999)} suffix="%" />
            </span>
            <span className="text-xs text-content-subtle">of goal</span>
          </ProgressRing>
          <div>
            <CardTitle>Today's Goal</CardTitle>
            <p className="text-2xl font-bold">{fmtDuration(dashboard.todayMinutes)}</p>
            <p className="text-sm text-content-subtle">
              of {fmtDuration(dashboard.dailyGoalMinutes)} target
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardTitle>Streak</CardTitle>
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="grid h-16 w-16 place-items-center rounded-2xl bg-warning/15"
            >
              <Flame size={34} className="text-warning" />
            </motion.div>
            <div>
              <p className="text-4xl font-bold">
                <CountUp value={dashboard.streak} />
              </p>
              <p className="text-sm text-content-subtle">
                {dashboard.streak === 1 ? 'day' : 'days'} in a row
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-content-subtle">
            {dashboard.streak === 0
              ? 'Log any activity today to start a streak.'
              : 'Keep it going — log something today!'}
          </p>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardTitle>Countdown</CardTitle>
          {dashboard.daysUntilTest != null ? (
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15">
                <CalendarClock size={34} className="text-accent" />
              </div>
              <div>
                <p className="text-4xl font-bold">
                  <CountUp value={dashboard.daysUntilTest} />
                </p>
                <p className="text-sm text-content-subtle">days until your MCAT</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-content-subtle">
              No test date set. Add one in Settings to unlock your countdown and plan.
            </p>
          )}
        </Card>
      </div>

      {/* Quick add */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickAction icon={<BookOpenCheck size={20} />} label="Log Study Session" onClick={() => openQuickAdd('session')} />
        <QuickAction icon={<Target size={20} />} label="Add Practice Questions" onClick={() => openQuickAdd('questions')} />
        <QuickAction icon={<GraduationCap size={20} />} label="Log Exam Score" onClick={() => openQuickAdd('exam')} />
      </div>

      {/* Recommendation + weekly hours */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardTitle right={<Lightbulb size={16} className="text-warning" />}>Focus Areas</CardTitle>
          <p className="text-sm leading-relaxed text-content">{dashboard.recommendation}</p>
          {dashboard.weakTopics.length > 0 && (
            <div className="mt-4 space-y-2">
              {dashboard.weakTopics.map((w) => (
                <div key={w.topic} className="flex items-center justify-between rounded-lg bg-surface-2/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <SectionTag section={w.section} />
                    <span className="truncate text-sm">{w.topic}</span>
                  </div>
                  <span className="text-sm font-bold text-danger">{w.accuracy}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle right={<span className="text-xs text-content-subtle">last 7 days</span>}>
            Study Hours
          </CardTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dashboard.weeklyHours}>
              <defs>
                <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--accent))" />
                  <stop offset="100%" stopColor="rgb(var(--violet))" />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgb(var(--content-subtle))', fontSize: 12 }}
              />
              <Tooltip cursor={{ fill: 'rgb(var(--surface-2) / 0.5)' }} content={<ChartTip unit="h" />} />
              <Bar dataKey="hours" fill="url(#bar-grad)" radius={[6, 6, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Section sparklines */}
      <Card>
        <CardTitle right={<TrendingUp size={16} className="text-content-subtle" />}>
          Section Score Trends
        </CardTitle>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {SECTIONS.map((s) => {
            const data = dashboard.sectionTrends[s.key].map((v, i) => ({ i, v }))
            const latest = data.at(-1)?.v
            return (
              <div key={s.key} className="rounded-xl bg-surface-2/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: s.color }}>
                    {s.short}
                  </span>
                  <span className="text-lg font-bold">{latest ?? '—'}</span>
                </div>
                <div className="mt-2 h-10">
                  {data.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data}>
                        <Line
                          type="monotone"
                          dataKey="v"
                          stroke={s.color}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="pt-3 text-xs text-content-subtle">Log full-lengths to see trends</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Quote + upcoming */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle right={<QuoteIcon size={16} className="text-content-subtle" />}>
            Tip of the Day
          </CardTitle>
          {quote && (
            <>
              <p className="text-lg font-medium italic leading-relaxed text-content">"{quote.text}"</p>
              <p className="mt-2 text-sm text-content-subtle">— {quote.author}</p>
            </>
          )}
        </Card>

        <Card>
          <CardTitle>Upcoming</CardTitle>
          {dashboard.upcoming.length === 0 ? (
            <p className="text-sm text-content-subtle">
              Nothing scheduled. Add tasks and deadlines in the Calendar.
            </p>
          ) : (
            <div className="space-y-2">
              {dashboard.upcoming.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-surface-2/50 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <SectionTag section={t.section} />
                    <span className="text-sm">{t.title}</span>
                  </div>
                  <span className="text-xs text-content-subtle">{fmtDate(t.dueDate)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function QuickAction({
  icon,
  label,
  onClick
}: {
  icon: JSX.Element
  label: string
  onClick: () => void
}): JSX.Element {
  return (
    <motion.button
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="card flex items-center gap-3 p-4 text-left transition-shadow hover:shadow-card-hover"
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-gradient text-white shadow-glow">
        {icon}
      </span>
      <span className="font-semibold">{label}</span>
    </motion.button>
  )
}

/** Shared dark tooltip for charts. */
export function ChartTip({
  active,
  payload,
  label,
  unit = ''
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color?: string }>
  label?: string
  unit?: string
}): JSX.Element | null {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs">
      {label && <p className="mb-1 font-semibold text-content">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-content-muted" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}{unit}</span>
        </p>
      ))}
    </div>
  )
}
