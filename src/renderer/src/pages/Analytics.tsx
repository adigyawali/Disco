import { useEffect } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { ArrowDownRight, ArrowUpRight, BarChart3, Gauge, TrendingUp } from 'lucide-react'
import { PageHeader, EmptyState, SectionTag } from '@renderer/components/ui/Misc'
import { Card, CardTitle } from '@renderer/components/ui/Card'
import { ProgressRing } from '@renderer/components/ui/ProgressRing'
import { CountUp } from '@renderer/components/ui/CountUp'
import { ChartTip } from '@renderer/pages/Dashboard'
import { useApp } from '@renderer/stores/app'
import { fmtDate, fmtDuration } from '@renderer/lib/utils'
import { SECTION_BY_KEY } from '@shared/types'

const DONUT_COLORS = ['#4F8EF7', '#00D4FF', '#9B7CFF', '#34D399', '#FBBF24', '#F87171', '#60A5FA', '#A78BFA']

function accColor(acc: number): string {
  if (acc >= 80) return 'rgb(var(--success))'
  if (acc >= 60) return 'rgb(var(--warning))'
  return 'rgb(var(--danger))'
}

export function Analytics(): JSX.Element {
  const analytics = useApp((s) => s.analytics)
  const refresh = useApp((s) => s.refreshAnalytics)

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (!analytics) return <div className="h-40" />

  const a = analytics
  const hasData =
    a.examTrend.length > 0 || a.topicAccuracy.length > 0 || a.studyHoursByWeek.some((w) => w.hours > 0)

  if (!hasData) {
    return (
      <div>
        <PageHeader title="Analytics & Insights" subtitle="Your performance, visualized." />
        <EmptyState
          icon={<BarChart3 size={40} />}
          title="Not enough data yet"
          hint="Log study sessions, question sets, and full-lengths. Your trends, projections, and readiness will appear here."
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Analytics & Insights" subtitle="Your performance, visualized — projections, trends, and readiness." />

      {/* Readiness hero */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
        <Card className="flex items-center gap-6">
          <ProgressRing value={a.readinessPct} size={150}>
            <span className="text-4xl font-bold">
              <CountUp value={a.readinessPct} suffix="%" />
            </span>
            <span className="text-xs text-content-subtle">ready</span>
          </ProgressRing>
          <div>
            <CardTitle right={<Gauge size={16} className="text-accent" />}>Readiness</CardTitle>
            {a.projectedTotal != null && (
              <p className="text-3xl font-bold">
                <CountUp value={a.projectedTotal} />
                <span className="ml-1 text-sm font-medium text-content-subtle">projected</span>
              </p>
            )}
          </div>
        </Card>
        <Card className="flex items-center">
          <div>
            <CardTitle right={<TrendingUp size={16} className="text-content-subtle" />}>Insight</CardTitle>
            <p className="text-lg leading-relaxed">{a.readinessInsight}</p>
          </div>
        </Card>
      </div>

      {/* Section accuracy + exam trend */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Accuracy by Section</CardTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={a.sectionAccuracy.map((s) => ({ name: SECTION_BY_KEY[s.section].short, acc: s.accuracy ?? 0, key: s.section }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border) / 0.5)" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--content-subtle))', fontSize: 12 }} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--content-subtle))', fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'rgb(var(--surface-2) / 0.5)' }} content={<ChartTip unit="%" />} />
              <Bar dataKey="acc" name="Accuracy" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {a.sectionAccuracy.map((s) => (
                  <Cell key={s.section} fill={SECTION_BY_KEY[s.section].color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle>Exam Trend</CardTitle>
          {a.examTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={a.examTrend.map((e) => ({ label: fmtDate(e.date).replace(/, \d{4}/, ''), ...e }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border) / 0.5)" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--content-subtle))', fontSize: 12 }} />
                <YAxis domain={[472, 528]} axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--content-subtle))', fontSize: 12 }} />
                <Tooltip content={<ChartTip />} />
                <Line type="monotone" dataKey="total" name="Total" stroke="rgb(var(--accent))" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-content-subtle">Log full-lengths to see your trajectory.</p>
          )}
        </Card>
      </div>

      {/* Study hours + resource donut */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardTitle right={<span className="text-xs text-content-subtle">last 8 weeks</span>}>
            Study Hours by Week
          </CardTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={a.studyHoursByWeek}>
              <defs>
                <linearGradient id="hrs-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--accent))" />
                  <stop offset="100%" stopColor="rgb(var(--violet))" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border) / 0.5)" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--content-subtle))', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--content-subtle))', fontSize: 11 }} />
              <Tooltip cursor={{ fill: 'rgb(var(--surface-2) / 0.5)' }} content={<ChartTip unit="h" />} />
              <Bar dataKey="hours" fill="url(#hrs-grad)" radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle>Time by Resource</CardTitle>
          {a.resourceTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={a.resourceTime}
                  dataKey="minutes"
                  nameKey="resource"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {a.resourceTime.map((_, i) => (
                    <Cell key={i} stroke="none" fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="card px-3 py-2 text-xs">
                        <span className="font-semibold">{payload[0].name}</span>:{' '}
                        {fmtDuration(payload[0].value as number)}
                      </div>
                    ) : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-content-subtle">Log sessions with resources.</p>
          )}
        </Card>
      </div>

      {/* Topic heatmap */}
      {a.topicAccuracy.length > 0 && (
        <Card className="mb-6">
          <CardTitle>Topic Accuracy Heatmap</CardTitle>
          <div className="flex flex-wrap gap-2">
            {a.topicAccuracy.map((t) => (
              <div
                key={t.topic}
                className="rounded-lg px-3 py-2 text-xs font-medium"
                style={{ background: `${accColor(t.accuracy)}22`, color: accColor(t.accuracy), border: `1px solid ${accColor(t.accuracy)}44` }}
                title={`${t.attempted} attempted`}
              >
                {t.topic} · {t.accuracy}%
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Streak calendar */}
      <Card className="mb-6">
        <CardTitle>Study Activity</CardTitle>
        <StreakHeatmap data={a.streakCalendar} />
      </Card>

      {/* Weakest / strongest */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle right={<ArrowDownRight size={16} className="text-danger" />}>Weakest Topics</CardTitle>
          <RankedList items={a.weakest} />
        </Card>
        <Card>
          <CardTitle right={<ArrowUpRight size={16} className="text-success" />}>Strongest Topics</CardTitle>
          <RankedList items={a.strongest} />
        </Card>
      </div>
    </div>
  )
}

function RankedList({
  items
}: {
  items: { topic: string; section: import('@shared/types').SectionKey; accuracy: number; attempted: number }[]
}): JSX.Element {
  if (items.length === 0) return <p className="text-sm text-content-subtle">Need ≥5 attempts per topic to rank.</p>
  return (
    <div className="space-y-2">
      {items.map((t) => (
        <div key={t.topic} className="flex items-center justify-between rounded-lg bg-surface-2/50 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <SectionTag section={t.section} />
            <span className="truncate text-sm">{t.topic}</span>
          </div>
          <span className="text-sm font-bold" style={{ color: accColor(t.accuracy) }}>
            {t.accuracy}%
          </span>
        </div>
      ))}
    </div>
  )
}

/** GitHub-style contribution heatmap (17 weeks × 7 days). */
function StreakHeatmap({ data }: { data: { date: string; minutes: number }[] }): JSX.Element {
  const max = Math.max(60, ...data.map((d) => d.minutes))
  const level = (m: number): number => (m === 0 ? 0 : Math.min(4, Math.ceil((m / max) * 4)))
  const colors = [
    'rgb(var(--surface-2))',
    'rgb(var(--accent) / 0.3)',
    'rgb(var(--accent) / 0.55)',
    'rgb(var(--accent) / 0.8)',
    'rgb(var(--accent))'
  ]

  // Chunk into weeks of 7 (data is oldest→newest, length 119 = 17 weeks).
  const weeks: { date: string; minutes: number }[][] = []
  for (let i = 0; i < data.length; i += 7) weeks.push(data.slice(i, i + 7))

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((day) => (
            <div
              key={day.date}
              className="h-3.5 w-3.5 rounded-sm"
              style={{ background: colors[level(day.minutes)] }}
              title={`${fmtDate(day.date)}: ${fmtDuration(day.minutes)}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
