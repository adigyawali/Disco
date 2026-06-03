import { motion } from 'framer-motion'
import { Plus, Target, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader, EmptyState, SectionTag } from '@renderer/components/ui/Misc'
import { Card, CardTitle } from '@renderer/components/ui/Card'
import { Button } from '@renderer/components/ui/Button'
import { SectionPicker } from '@renderer/components/ui/Form'
import { LogQuestionsModal } from '@renderer/components/modals/LogQuestionsModal'
import { useApp } from '@renderer/stores/app'
import { fmtDate } from '@renderer/lib/utils'
import { SECTIONS, type SectionKey } from '@shared/types'

/** Map accuracy 0-100 to a red→amber→green color. */
function accColor(acc: number): string {
  if (acc >= 80) return 'rgb(var(--success))'
  if (acc >= 60) return 'rgb(var(--warning))'
  return 'rgb(var(--danger))'
}

export function Questions(): JSX.Element {
  const questions = useApp((s) => s.questions)
  const removeQuestion = useApp((s) => s.removeQuestion)
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<SectionKey | null>(null)

  const sectionStats = useMemo(() => {
    const map = {} as Record<SectionKey, { attempted: number; correct: number }>
    for (const s of SECTIONS) map[s.key] = { attempted: 0, correct: 0 }
    for (const q of questions) {
      if (!q.section) continue
      map[q.section].attempted += q.attempted
      map[q.section].correct += q.correct
    }
    return map
  }, [questions])

  const topicStats = useMemo(() => {
    const map: Record<string, { section: SectionKey; attempted: number; correct: number }> = {}
    for (const q of questions) {
      if (!q.topic || !q.section) continue
      map[q.topic] ??= { section: q.section, attempted: 0, correct: 0 }
      map[q.topic].attempted += q.attempted
      map[q.topic].correct += q.correct
    }
    return Object.entries(map)
      .map(([topic, t]) => ({
        topic,
        section: t.section,
        attempted: t.attempted,
        accuracy: Math.round((t.correct / t.attempted) * 100)
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
  }, [questions])

  const filtered = filter ? questions.filter((q) => q.section === filter) : questions

  return (
    <div>
      <PageHeader
        title="Question Bank"
        subtitle="Track every practice set. Accuracy per section and topic, with automatic weak-topic flagging."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Log Questions
          </Button>
        }
      />

      {/* Per-section accuracy */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {SECTIONS.map((s) => {
          const st = sectionStats[s.key]
          const acc = st.attempted ? Math.round((st.correct / st.attempted) * 100) : null
          return (
            <Card key={s.key} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: s.color }}>
                  {s.short}
                </span>
                <span className="text-2xl font-bold" style={{ color: acc != null ? accColor(acc) : undefined }}>
                  {acc != null ? `${acc}%` : '—'}
                </span>
              </div>
              <p className="mt-1 text-xs text-content-subtle">
                {st.correct}/{st.attempted} correct
              </p>
            </Card>
          )
        })}
      </div>

      {/* Topic heatmap */}
      {topicStats.length > 0 && (
        <Card className="mb-6">
          <CardTitle>Topic Performance Heatmap</CardTitle>
          <div className="flex flex-wrap gap-2">
            {topicStats.map((t) => (
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

      <div className="mb-4">
        <SectionPicker value={filter} onChange={setFilter} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Target size={40} />}
          title="No question sets logged"
          hint="Log a UWorld or AAMC block to start tracking accuracy and surfacing weak topics."
          action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Log Questions</Button>}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((q, i) => {
            const acc = q.attempted ? Math.round((q.correct / q.attempted) * 100) : 0
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="card group flex items-center gap-4 p-4"
              >
                <div
                  className="grid h-14 w-14 place-items-center rounded-xl text-lg font-bold"
                  style={{ background: `${accColor(acc)}22`, color: accColor(acc) }}
                >
                  {acc}%
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <SectionTag section={q.section} />
                    <span className="truncate font-medium">{q.topic || 'Mixed'}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-content-subtle">
                    {fmtDate(q.date)} · {q.resource || 'No resource'} · {q.correct}/{q.attempted} correct · {q.timeSpentMin}m
                  </p>
                  {q.notes && <p className="mt-1 truncate text-sm text-content-muted">{q.notes}</p>}
                </div>
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="rounded-lg p-2 text-content-subtle opacity-0 transition-all hover:bg-danger/15 hover:text-danger group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

      <LogQuestionsModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
