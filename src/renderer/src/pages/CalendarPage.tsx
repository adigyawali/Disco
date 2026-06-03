import { useCallback, useMemo, useState } from 'react'
import { Calendar, dateFnsLocalizer, type Event } from 'react-big-calendar'
import withDragAndDrop, { type withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { CalendarPlus, Flag, Trash2 } from 'lucide-react'
import { PageHeader } from '@renderer/components/ui/Misc'
import { Card } from '@renderer/components/ui/Card'
import { Button } from '@renderer/components/ui/Button'
import { Modal } from '@renderer/components/ui/Modal'
import { Field, Input, Select, SectionPicker } from '@renderer/components/ui/Form'
import { useApp } from '@renderer/stores/app'
import { sectionColor, todayIso } from '@renderer/lib/utils'
import { SECTION_BY_KEY, type SectionKey, type Task } from '@shared/types'

import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import '@renderer/styles/calendar.css'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { 'en-US': enUS }
})

interface TaskEvent extends Event {
  task: Task
}

const DnDCalendar = withDragAndDrop<TaskEvent>(Calendar)

const toDate = (iso: string): Date => new Date(iso + 'T00:00:00')

export function CalendarPage(): JSX.Element {
  const tasks = useApp((s) => s.tasks)
  const addTask = useApp((s) => s.addTask)
  const updateTask = useApp((s) => s.updateTask)
  const removeTask = useApp((s) => s.removeTask)

  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState(todayIso())
  const [section, setSection] = useState<SectionKey | null>(null)
  const [type, setType] = useState<Task['type']>('task')

  const events: TaskEvent[] = useMemo(
    () =>
      tasks.map((t) => ({
        title: t.title,
        start: toDate(t.dueDate),
        end: toDate(t.dueDate),
        allDay: true,
        task: t
      })),
    [tasks]
  )

  const onEventDrop = useCallback<NonNullable<withDragAndDropProps<TaskEvent>['onEventDrop']>>(
    ({ event, start }) => {
      const d = start instanceof Date ? start : new Date(start)
      void updateTask(event.task.id, { dueDate: format(d, 'yyyy-MM-dd') })
    },
    [updateTask]
  )

  const eventStyleGetter = (event: TaskEvent): { style: React.CSSProperties } => {
    const color = event.task.type === 'deadline' ? 'rgb(var(--danger))' : sectionColor(event.task.section)
    return {
      style: {
        background: `${color}`,
        color: '#fff',
        opacity: event.task.completed ? 0.5 : 1,
        textDecoration: event.task.completed ? 'line-through' : 'none'
      }
    }
  }

  const submit = async (): Promise<void> => {
    if (!title.trim()) return
    await addTask({ title: title.trim(), dueDate, section, type, completed: false })
    setTitle('')
    setModalOpen(false)
  }

  const openSlot = (date: Date): void => {
    setDueDate(format(date, 'yyyy-MM-dd'))
    setModalOpen(true)
  }

  const upcoming = tasks.filter((t) => !t.completed).slice(0, 8)

  return (
    <div>
      <PageHeader
        title="Calendar & Planner"
        subtitle="Drag to reschedule. Color-coded by section, with deadlines flagged in red."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <CalendarPlus size={16} /> Add Item
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <Card className="p-4">
          <div style={{ height: 640 }}>
            <DnDCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              defaultView="month"
              views={['month', 'week', 'agenda']}
              popup
              selectable
              onSelectSlot={(slot) => openSlot(slot.start as Date)}
              onSelectEvent={(e) => updateTask(e.task.id, { completed: !e.task.completed })}
              onEventDrop={onEventDrop}
              eventPropGetter={eventStyleGetter}
            />
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-content-muted">
            To-do
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-content-subtle">Click a day or "Add Item" to plan tasks and deadlines.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((t) => (
                <div key={t.id} className="group flex items-center gap-2 rounded-lg bg-surface-2/50 px-3 py-2">
                  <button
                    onClick={() => updateTask(t.id, { completed: !t.completed })}
                    className="grid h-4 w-4 place-items-center rounded border border-border-strong"
                  />
                  {t.type === 'deadline' && <Flag size={12} className="text-danger" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{t.title}</p>
                    <p className="text-[11px] text-content-subtle">
                      {format(toDate(t.dueDate), 'MMM d')}
                      {t.section && ` · ${SECTION_BY_KEY[t.section].short}`}
                    </p>
                  </div>
                  <button
                    onClick={() => removeTask(t.id)}
                    className="text-content-subtle opacity-0 hover:text-danger group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Calendar Item"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!title.trim()}>Add</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="e.g. Take AAMC FL 2" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date">
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
            <Field label="Type">
              <Select value={type} onChange={(e) => setType(e.target.value as Task['type'])}>
                <option value="task">Task</option>
                <option value="deadline">Deadline</option>
              </Select>
            </Field>
          </div>
          <Field label="Section">
            <SectionPicker value={section} onChange={setSection} />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
