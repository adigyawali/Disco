import { useMemo, useState } from 'react'
import { Modal } from '@renderer/components/ui/Modal'
import { Button } from '@renderer/components/ui/Button'
import { Field, Input, Select, Textarea, RatingPicker, SectionPicker } from '@renderer/components/ui/Form'
import { useApp } from '@renderer/stores/app'
import { todayIso } from '@renderer/lib/utils'
import { STUDY_RESOURCES, type SectionKey } from '@shared/types'

export function LogSessionModal({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}): JSX.Element {
  const addSession = useApp((s) => s.addSession)
  const content = useApp((s) => s.content)

  const [date, setDate] = useState(todayIso())
  const [duration, setDuration] = useState(60)
  const [section, setSection] = useState<SectionKey | null>(null)
  const [topic, setTopic] = useState('')
  const [resource, setResource] = useState<string>(STUDY_RESOURCES[0])
  const [focus, setFocus] = useState(4)
  const [energy, setEnergy] = useState(4)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Topic suggestions scoped to the selected section.
  const topicOptions = useMemo(
    () => content.filter((t) => !section || t.section === section).map((t) => t.name),
    [content, section]
  )

  const reset = (): void => {
    setDate(todayIso())
    setDuration(60)
    setSection(null)
    setTopic('')
    setResource(STUDY_RESOURCES[0])
    setFocus(4)
    setEnergy(4)
    setNotes('')
  }

  const submit = async (): Promise<void> => {
    setSaving(true)
    await addSession({
      date,
      durationMin: duration,
      section,
      topic: topic || null,
      resource,
      notes: notes || null,
      focus,
      energy
    })
    setSaving(false)
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log Study Session"
      width={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || duration <= 0}>
            Save Session
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Duration (minutes)">
            <Input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </Field>
        </div>

        <Field label="Section">
          <SectionPicker value={section} onChange={setSection} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Topic">
            <Input
              list="session-topics"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Enzyme kinetics"
            />
            <datalist id="session-topics">
              {topicOptions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
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

        <div className="grid grid-cols-2 gap-4">
          <Field label="Focus">
            <RatingPicker value={focus} onChange={setFocus} />
          </Field>
          <Field label="Energy">
            <RatingPicker value={energy} onChange={setEnergy} />
          </Field>
        </div>

        <Field label="Notes">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you cover? Any insights?"
          />
        </Field>
      </div>
    </Modal>
  )
}
