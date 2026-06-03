import { useMemo, useState } from 'react'
import { Modal } from '@renderer/components/ui/Modal'
import { Button } from '@renderer/components/ui/Button'
import { Field, Input, Select, Textarea, SectionPicker } from '@renderer/components/ui/Form'
import { useApp } from '@renderer/stores/app'
import { todayIso } from '@renderer/lib/utils'
import { STUDY_RESOURCES, type SectionKey } from '@shared/types'

export function LogQuestionsModal({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}): JSX.Element {
  const addQuestion = useApp((s) => s.addQuestion)
  const content = useApp((s) => s.content)

  const [date, setDate] = useState(todayIso())
  const [resource, setResource] = useState<string>('UWorld')
  const [section, setSection] = useState<SectionKey | null>('cp')
  const [topic, setTopic] = useState('')
  const [attempted, setAttempted] = useState(10)
  const [correct, setCorrect] = useState(7)
  const [time, setTime] = useState(20)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const topicOptions = useMemo(
    () => content.filter((t) => !section || t.section === section).map((t) => t.name),
    [content, section]
  )

  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0

  const submit = async (): Promise<void> => {
    setSaving(true)
    await addQuestion({
      date,
      resource,
      section,
      topic: topic || null,
      attempted,
      correct: Math.min(correct, attempted),
      timeSpentMin: time,
      notes: notes || null
    })
    setSaving(false)
    setTopic('')
    setNotes('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log Practice Questions"
      width={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || attempted <= 0}>
            Save Set
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Resource">
            <Select value={resource} onChange={(e) => setResource(e.target.value)}>
              {STUDY_RESOURCES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Other">Other</option>
            </Select>
          </Field>
        </div>

        <Field label="Section">
          <SectionPicker value={section} onChange={setSection} allowNull={false} />
        </Field>

        <Field label="Topic">
          <Input
            list="q-topics"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Acids & bases / titrations"
          />
          <datalist id="q-topics">
            {topicOptions.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Attempted">
            <Input
              type="number"
              min={1}
              value={attempted}
              onChange={(e) => setAttempted(Number(e.target.value))}
            />
          </Field>
          <Field label="Correct">
            <Input
              type="number"
              min={0}
              max={attempted}
              value={correct}
              onChange={(e) => setCorrect(Number(e.target.value))}
            />
          </Field>
          <Field label="Time (min)">
            <Input type="number" min={0} value={time} onChange={(e) => setTime(Number(e.target.value))} />
          </Field>
        </div>

        <div className="rounded-xl bg-surface-2/50 px-4 py-3 text-sm">
          <span className="text-content-muted">Accuracy: </span>
          <span
            className="font-bold"
            style={{ color: accuracy >= 60 ? 'rgb(var(--success))' : 'rgb(var(--danger))' }}
          >
            {accuracy}%
          </span>
        </div>

        <Field label="Notes (what you missed, patterns)">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
