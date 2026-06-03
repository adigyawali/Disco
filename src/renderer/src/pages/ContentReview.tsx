import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '@renderer/components/ui/Misc'
import { Card } from '@renderer/components/ui/Card'
import { ProgressBar } from '@renderer/components/ui/ProgressBar'
import { useApp } from '@renderer/stores/app'
import { cn } from '@renderer/lib/utils'
import {
  SECTIONS,
  type ContentStatus,
  type ContentTopicWithProgress,
  type SectionKey
} from '@shared/types'

const STATUS_ORDER: ContentStatus[] = ['not_started', 'in_progress', 'reviewed', 'mastered']
const STATUS_META: Record<ContentStatus, { label: string; color: string }> = {
  not_started: { label: 'Not started', color: 'rgb(var(--content-subtle))' },
  in_progress: { label: 'In progress', color: 'rgb(var(--warning))' },
  reviewed: { label: 'Reviewed', color: 'rgb(var(--accent))' },
  mastered: { label: 'Mastered', color: 'rgb(var(--success))' }
}
const STATUS_WEIGHT: Record<ContentStatus, number> = {
  not_started: 0,
  in_progress: 0.4,
  reviewed: 0.8,
  mastered: 1
}

const pct = (topics: ContentTopicWithProgress[]): number =>
  topics.length
    ? Math.round((topics.reduce((a, t) => a + STATUS_WEIGHT[t.status], 0) / topics.length) * 100)
    : 0

export function ContentReview(): JSX.Element {
  const content = useApp((s) => s.content)
  const setStatus = useApp((s) => s.setContentStatus)

  const bySection = useMemo(() => {
    const map = {} as Record<SectionKey, ContentTopicWithProgress[]>
    for (const s of SECTIONS) map[s.key] = []
    for (const t of content) map[t.section].push(t)
    return map
  }, [content])

  return (
    <div>
      <PageHeader
        title="Content Review"
        subtitle="Track every high-yield topic from Not Started to Mastered. Weak topics are flagged from your question accuracy."
      />
      <div className="space-y-5">
        {SECTIONS.map((section) => (
          <SectionBlock
            key={section.key}
            sectionKey={section.key}
            title={section.full}
            short={section.short}
            color={section.color}
            topics={bySection[section.key]}
            onSetStatus={setStatus}
          />
        ))}
      </div>
    </div>
  )
}

function SectionBlock({
  title,
  short,
  color,
  topics,
  onSetStatus
}: {
  sectionKey: SectionKey
  title: string
  short: string
  color: string
  topics: ContentTopicWithProgress[]
  onSetStatus: (id: number, status: ContentStatus) => void
}): JSX.Element {
  // Group topics by subject preserving order.
  const subjects = useMemo(() => {
    const order: string[] = []
    const map: Record<string, ContentTopicWithProgress[]> = {}
    for (const t of topics) {
      if (!map[t.subject]) {
        map[t.subject] = []
        order.push(t.subject)
      }
      map[t.subject].push(t)
    }
    return order.map((name) => ({ name, items: map[name] }))
  }, [topics])

  return (
    <Card>
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-lg px-2.5 py-1 text-xs font-bold text-white" style={{ background: color }}>
          {short}
        </span>
        <h3 className="flex-1 font-semibold">{title}</h3>
        <span className="text-sm font-bold" style={{ color }}>
          {pct(topics)}%
        </span>
      </div>
      <ProgressBar value={pct(topics)} color={color} className="mb-4" />

      <div className="space-y-2">
        {subjects.map((sub) => (
          <SubjectGroup key={sub.name} name={sub.name} items={sub.items} onSetStatus={onSetStatus} />
        ))}
      </div>
    </Card>
  )
}

function SubjectGroup({
  name,
  items,
  onSetStatus
}: {
  name: string
  items: ContentTopicWithProgress[]
  onSetStatus: (id: number, status: ContentStatus) => void
}): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <div className="overflow-hidden rounded-xl bg-surface-2/40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2/70"
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }}>
          <ChevronRight size={16} className="text-content-subtle" />
        </motion.span>
        <span className="flex-1 text-sm font-medium">{name}</span>
        <span className="text-xs text-content-subtle">{pct(items)}%</span>
        <div className="w-24">
          <ProgressBar value={pct(items)} height={5} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 px-3 pb-3 pt-1">
              {items.map((t) => (
                <TopicRow key={t.id} topic={t} onSetStatus={onSetStatus} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TopicRow({
  topic,
  onSetStatus
}: {
  topic: ContentTopicWithProgress
  onSetStatus: (id: number, status: ContentStatus) => void
}): JSX.Element {
  const weak = topic.accuracy != null && topic.accuracy < 60
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface/40">
      <span className="flex-1 text-sm">{topic.name}</span>
      {weak && (
        <span className="chip bg-danger/15 text-danger" title="Below 60% accuracy">
          <AlertTriangle size={12} /> {topic.accuracy}%
        </span>
      )}
      {!weak && topic.accuracy != null && (
        <span className="text-xs text-content-subtle">{topic.accuracy}%</span>
      )}
      <div className="flex gap-1">
        {STATUS_ORDER.map((st) => {
          const active = topic.status === st
          const meta = STATUS_META[st]
          return (
            <button
              key={st}
              onClick={() => onSetStatus(topic.id, st)}
              title={meta.label}
              className={cn(
                'h-3 w-3 rounded-full transition-all',
                active ? 'scale-110' : 'opacity-30 hover:opacity-70'
              )}
              style={{ background: meta.color }}
            />
          )
        })}
      </div>
      <span className="w-20 text-right text-[11px]" style={{ color: STATUS_META[topic.status].color }}>
        {STATUS_META[topic.status].label}
      </span>
    </div>
  )
}
