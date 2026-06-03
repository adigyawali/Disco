import { motion } from 'framer-motion'
import { BookOpenCheck, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader, EmptyState, SectionTag, StatTile } from '@renderer/components/ui/Misc'
import { Card } from '@renderer/components/ui/Card'
import { Button } from '@renderer/components/ui/Button'
import { Input, SectionPicker } from '@renderer/components/ui/Form'
import { LogSessionModal } from '@renderer/components/modals/LogSessionModal'
import { useApp } from '@renderer/stores/app'
import { fmtDate, fmtDuration } from '@renderer/lib/utils'
import type { SectionKey } from '@shared/types'

export function Sessions(): JSX.Element {
  const sessions = useApp((s) => s.sessions)
  const removeSession = useApp((s) => s.removeSession)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<SectionKey | null>(null)

  const filtered = useMemo(
    () =>
      sessions.filter((s) => {
        if (filter && s.section !== filter) return false
        if (!query) return true
        const q = query.toLowerCase()
        return (
          (s.topic ?? '').toLowerCase().includes(q) ||
          (s.resource ?? '').toLowerCase().includes(q) ||
          (s.notes ?? '').toLowerCase().includes(q)
        )
      }),
    [sessions, filter, query]
  )

  const totalMin = sessions.reduce((a, s) => a + s.durationMin, 0)
  const avgFocus = sessions.length
    ? (sessions.reduce((a, s) => a + s.focus, 0) / sessions.length).toFixed(1)
    : '—'

  return (
    <div>
      <PageHeader
        title="Study Log"
        subtitle="Every session you've logged, searchable and filterable."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Log Session
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Sessions">{sessions.length}</StatTile>
        <StatTile label="Total Time">{fmtDuration(totalMin)}</StatTile>
        <StatTile label="Avg Focus">{avgFocus}</StatTile>
        <StatTile label="This Filter">{filtered.length}</StatTile>
      </div>

      <Card className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-subtle" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, resources, notes…"
            className="pl-10"
          />
        </div>
        <SectionPicker value={filter} onChange={setFilter} />
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpenCheck size={40} />}
          title="No sessions yet"
          hint="Log your first study session to start building your history and streak."
          action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Log Session</Button>}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className="card group flex items-center gap-4 p-4"
            >
              <div className="flex w-16 flex-col items-center rounded-xl bg-surface-2/60 px-2 py-2">
                <span className="text-lg font-bold leading-none">{s.durationMin}</span>
                <span className="text-[10px] text-content-subtle">min</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <SectionTag section={s.section} />
                  <span className="truncate font-medium">{s.topic || 'General study'}</span>
                </div>
                <p className="mt-0.5 text-xs text-content-subtle">
                  {fmtDate(s.date)} · {s.resource || 'No resource'} · Focus {s.focus}/5 · Energy {s.energy}/5
                </p>
                {s.notes && <p className="mt-1 truncate text-sm text-content-muted">{s.notes}</p>}
              </div>
              <button
                onClick={() => removeSession(s.id)}
                className="rounded-lg p-2 text-content-subtle opacity-0 transition-all hover:bg-danger/15 hover:text-danger group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <LogSessionModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
