import { motion } from 'framer-motion'
import { GraduationCap, Plus, Table2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { PageHeader, EmptyState, StatTile } from '@renderer/components/ui/Misc'
import { Card, CardTitle } from '@renderer/components/ui/Card'
import { Button } from '@renderer/components/ui/Button'
import { Modal } from '@renderer/components/ui/Modal'
import { LogExamModal } from '@renderer/components/modals/LogExamModal'
import { ChartTip } from '@renderer/pages/Dashboard'
import { useApp } from '@renderer/stores/app'
import { fmtDate } from '@renderer/lib/utils'
import { SECTIONS } from '@shared/types'
import { PERCENTILE_TABLE, percentileForScore } from '@renderer/data/scoreConversion'

export function Exams(): JSX.Element {
  const exams = useApp((s) => s.exams)
  const settings = useApp((s) => s.settings)
  const removeExam = useApp((s) => s.removeExam)
  const [open, setOpen] = useState(false)
  const [tableOpen, setTableOpen] = useState(false)

  const latest = exams.at(-1)
  const best = exams.reduce<number | null>((m, e) => (e.total != null ? Math.max(m ?? 0, e.total) : m), null)

  const chartData = exams.map((e) => ({
    label: fmtDate(e.date).replace(/, \d{4}/, ''),
    Total: e.total,
    cp: e.scoreCp,
    cars: e.scoreCars,
    bb: e.scoreBb,
    ps: e.scorePs
  }))

  return (
    <div>
      <PageHeader
        title="Full-Lengths"
        subtitle="Track every practice exam, compare to your targets, and watch your trajectory."
        actions={
          <>
            <Button variant="ghost" onClick={() => setTableOpen(true)}>
              <Table2 size={16} /> Score Table
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> Log Exam
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Exams Taken">{exams.length}</StatTile>
        <StatTile label="Latest Total">
          {latest?.total ?? '—'}
          {latest?.total != null && (
            <span className="ml-1 text-sm font-medium text-content-subtle">
              · {percentileForScore(latest.total)}%ile
            </span>
          )}
        </StatTile>
        <StatTile label="Best Total">{best ?? '—'}</StatTile>
        <StatTile label="Target">{settings?.targetTotal ?? '—'}</StatTile>
      </div>

      {exams.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={40} />}
          title="No full-lengths yet"
          hint="Log your first practice exam to unlock score trends, projections, and readiness."
          action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Log Exam</Button>}
        />
      ) : (
        <>
          <Card className="mb-6">
            <CardTitle>Score Trajectory</CardTitle>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border) / 0.5)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'rgb(var(--content-subtle))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[472, 528]} tick={{ fill: 'rgb(var(--content-subtle))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {settings?.targetTotal && (
                  <ReferenceLine
                    y={settings.targetTotal}
                    stroke="rgb(var(--success))"
                    strokeDasharray="4 4"
                    label={{ value: `Target ${settings.targetTotal}`, fill: 'rgb(var(--success))', fontSize: 11, position: 'insideTopRight' }}
                  />
                )}
                <Line type="monotone" dataKey="Total" stroke="rgb(var(--content))" strokeWidth={3} dot={{ r: 4 }} />
                {SECTIONS.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.short}
                    stroke={s.color}
                    strokeWidth={1.5}
                    dot={false}
                    strokeOpacity={0.7}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <div className="space-y-3">
            {exams
              .slice()
              .reverse()
              .map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="card group p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="grid h-16 w-16 place-items-center rounded-xl bg-accent-gradient text-white shadow-glow">
                      <span className="text-xl font-bold">{e.total ?? '—'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{e.source}</span>
                        {e.total != null && (
                          <span className="chip bg-accent/15 text-accent">{percentileForScore(e.total)}%ile</span>
                        )}
                      </div>
                      <p className="text-xs text-content-subtle">{fmtDate(e.date)}</p>
                      <div className="mt-2 flex gap-3">
                        {SECTIONS.map((s) => {
                          const score = e[`score${s.key.charAt(0).toUpperCase()}${s.key.slice(1)}` as keyof typeof e] as number | null
                          return (
                            <span key={s.key} className="text-xs">
                              <span style={{ color: s.color }} className="font-semibold">{s.short}</span>{' '}
                              <span className="font-bold">{score ?? '—'}</span>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => removeExam(e.id)}
                      className="rounded-lg p-2 text-content-subtle opacity-0 transition-all hover:bg-danger/15 hover:text-danger group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {e.notes && (
                    <p className="mt-3 rounded-lg bg-surface-2/50 px-3 py-2 text-sm text-content-muted">{e.notes}</p>
                  )}
                </motion.div>
              ))}
          </div>
        </>
      )}

      <LogExamModal open={open} onClose={() => setOpen(false)} />

      <Modal open={tableOpen} onClose={() => setTableOpen(false)} title="AAMC Score Percentiles" width={420}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-content-subtle">
              <th className="pb-2 font-medium">Total Score</th>
              <th className="pb-2 font-medium">Percentile</th>
            </tr>
          </thead>
          <tbody>
            {PERCENTILE_TABLE.map((row) => (
              <tr key={row.score} className="border-t border-border">
                <td className="py-1.5 font-semibold">{row.score}</td>
                <td className="py-1.5 text-content-muted">{row.percentile}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-content-subtle">
          Reference based on AAMC published percentile ranks. Use as an approximation.
        </p>
      </Modal>
    </div>
  )
}
