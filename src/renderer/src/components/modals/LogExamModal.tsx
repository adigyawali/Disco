import { useState } from 'react'
import { Modal } from '@renderer/components/ui/Modal'
import { Button } from '@renderer/components/ui/Button'
import { Field, Input, Select, Textarea, RatingPicker } from '@renderer/components/ui/Form'
import { useApp } from '@renderer/stores/app'
import { todayIso, clamp } from '@renderer/lib/utils'
import {
  EXAM_SOURCES,
  SECTION_SCORE_MAX,
  SECTION_SCORE_MIN,
  SECTIONS
} from '@shared/types'

export function LogExamModal({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}): JSX.Element {
  const addExam = useApp((s) => s.addExam)

  const [date, setDate] = useState(todayIso())
  const [source, setSource] = useState<string>(EXAM_SOURCES[0])
  const [scores, setScores] = useState<Record<string, number>>({
    cp: 125,
    cars: 125,
    bb: 125,
    ps: 125
  })
  const [feeling, setFeeling] = useState(3)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const total = SECTIONS.reduce((a, s) => a + (scores[s.key] || 0), 0)

  const setScore = (key: string, v: number): void =>
    setScores((prev) => ({ ...prev, [key]: clamp(v, SECTION_SCORE_MIN, SECTION_SCORE_MAX) }))

  const submit = async (): Promise<void> => {
    setSaving(true)
    await addExam({
      date,
      source,
      scoreCp: scores.cp,
      scoreCars: scores.cars,
      scoreBb: scores.bb,
      scorePs: scores.ps,
      total,
      feeling,
      notes: notes || null
    })
    setSaving(false)
    setNotes('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log Full-Length Exam"
      width={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            Save Exam
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Exam Source">
            <Select value={source} onChange={(e) => setSource(e.target.value)}>
              {EXAM_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="Other">Other</option>
            </Select>
          </Field>
        </div>

        <Field label={`Section Scores (${SECTION_SCORE_MIN}–${SECTION_SCORE_MAX})`}>
          <div className="grid grid-cols-4 gap-3">
            {SECTIONS.map((s) => (
              <div key={s.key}>
                <div className="mb-1 text-center text-xs font-semibold" style={{ color: s.color }}>
                  {s.short}
                </div>
                <Input
                  type="number"
                  min={SECTION_SCORE_MIN}
                  max={SECTION_SCORE_MAX}
                  value={scores[s.key]}
                  onChange={(e) => setScore(s.key, Number(e.target.value))}
                  className="text-center"
                />
              </div>
            ))}
          </div>
        </Field>

        <div className="rounded-xl bg-accent-gradient/10 px-4 py-3 text-center">
          <span className="text-sm text-content-muted">Total Score: </span>
          <span className="text-2xl font-bold text-content">{total}</span>
        </div>

        <Field label="How did it feel?">
          <RatingPicker value={feeling} onChange={setFeeling} />
        </Field>

        <Field label="Notes (what went wrong, timing issues)">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
