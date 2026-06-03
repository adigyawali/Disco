import { motion } from 'framer-motion'
import { Layers, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { PageHeader, EmptyState, StatTile } from '@renderer/components/ui/Misc'
import { Card, CardTitle } from '@renderer/components/ui/Card'
import { Button } from '@renderer/components/ui/Button'
import { Field, Input } from '@renderer/components/ui/Form'
import { ChartTip } from '@renderer/pages/Dashboard'
import { useApp } from '@renderer/stores/app'
import { fmtDate, todayIso } from '@renderer/lib/utils'

const COMMON_DECKS = ['AnKing', 'Jacksparrow', 'MileDown', 'Custom']

export function Anki(): JSX.Element {
  const anki = useApp((s) => s.anki)
  const addAnki = useApp((s) => s.addAnki)
  const removeAnki = useApp((s) => s.removeAnki)

  const [date, setDate] = useState(todayIso())
  const [deck, setDeck] = useState('AnKing')
  const [reviews, setReviews] = useState(100)
  const [newCards, setNewCards] = useState(20)

  const totals = useMemo(
    () => ({
      reviews: anki.reduce((a, x) => a + x.reviews, 0),
      newCards: anki.reduce((a, x) => a + x.newCards, 0)
    }),
    [anki]
  )

  // Anki-specific streak (consecutive days with any reviews up to today).
  const streak = useMemo(() => {
    const days = new Set(anki.filter((a) => a.reviews > 0).map((a) => a.date))
    let cur = new Date()
    if (!days.has(todayIso())) cur.setDate(cur.getDate() - 1)
    let n = 0
    while (days.has(cur.toISOString().slice(0, 10))) {
      n++
      cur.setDate(cur.getDate() - 1)
    }
    return n
  }, [anki])

  const chartData = useMemo(() => {
    const out: { label: string; reviews: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const reviews = anki.filter((a) => a.date === key).reduce((s, a) => s + a.reviews, 0)
      out.push({ label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), reviews })
    }
    return out
  }, [anki])

  const submit = async (): Promise<void> => {
    await addAnki({ date, deck, reviews, newCards })
  }

  return (
    <div>
      <PageHeader title="Anki" subtitle="Log your daily card reviews and new cards. Spaced repetition compounds." />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Total Reviews">{totals.reviews.toLocaleString()}</StatTile>
        <StatTile label="New Cards Learned">{totals.newCards.toLocaleString()}</StatTile>
        <StatTile label="Anki Streak">{streak}</StatTile>
        <StatTile label="Days Logged">{new Set(anki.map((a) => a.date)).size}</StatTile>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardTitle>Log Today</CardTitle>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Deck">
                <Input list="decks" value={deck} onChange={(e) => setDeck(e.target.value)} />
                <datalist id="decks">
                  {COMMON_DECKS.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Reviews">
                <Input type="number" min={0} value={reviews} onChange={(e) => setReviews(Number(e.target.value))} />
              </Field>
              <Field label="New cards">
                <Input type="number" min={0} value={newCards} onChange={(e) => setNewCards(Number(e.target.value))} />
              </Field>
            </div>
            <Button onClick={submit} className="w-full">
              <Plus size={16} /> Log Anki
            </Button>
          </div>
        </Card>

        <Card>
          <CardTitle right={<span className="text-xs text-content-subtle">last 14 days</span>}>
            Reviews
          </CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--content-subtle))', fontSize: 11 }} />
              <Tooltip cursor={{ fill: 'rgb(var(--surface-2) / 0.5)' }} content={<ChartTip />} />
              <Bar dataKey="reviews" fill="rgb(var(--accent))" radius={[5, 5, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="mt-6">
        {anki.length === 0 ? (
          <EmptyState icon={<Layers size={40} />} title="No Anki logs yet" hint="Log your first day of reviews above." />
        ) : (
          <div className="space-y-2">
            {anki.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.2) }}
                className="card group flex items-center gap-4 p-3.5"
              >
                <Layers size={18} className="text-accent" />
                <span className="font-medium">{a.deck || 'Anki'}</span>
                <span className="text-sm text-content-muted">{a.reviews} reviews · {a.newCards} new</span>
                <span className="ml-auto text-xs text-content-subtle">{fmtDate(a.date)}</span>
                <button
                  onClick={() => removeAnki(a.id)}
                  className="rounded-lg p-1.5 text-content-subtle opacity-0 hover:text-danger group-hover:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
