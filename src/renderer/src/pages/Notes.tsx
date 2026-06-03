import { Eye, FileText, Pencil, Pin, PinOff, Plus, Search, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, EmptyState, SectionTag } from '@renderer/components/ui/Misc'
import { Card } from '@renderer/components/ui/Card'
import { Button } from '@renderer/components/ui/Button'
import { Input, SectionPicker, Textarea } from '@renderer/components/ui/Form'
import { useApp } from '@renderer/stores/app'
import { cn } from '@renderer/lib/utils'
import { STARTER_NOTES } from '@renderer/data/starterNotes'
import type { Note, SectionKey } from '@shared/types'

/** Minimal, safe-enough markdown → HTML for trusted local notes. */
function renderMarkdown(src: string): string {
  const esc = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const lines = esc(src).split('\n')
  const html: string[] = []
  let inList = false
  for (let line of lines) {
    if (/^###\s+/.test(line)) line = `<h3>${line.replace(/^###\s+/, '')}</h3>`
    else if (/^##\s+/.test(line)) line = `<h2>${line.replace(/^##\s+/, '')}</h2>`
    else if (/^#\s+/.test(line)) line = `<h1>${line.replace(/^#\s+/, '')}</h1>`

    const isLi = /^[-*]\s+/.test(line)
    if (isLi && !inList) {
      html.push('<ul>')
      inList = true
    } else if (!isLi && inList) {
      html.push('</ul>')
      inList = false
    }
    if (isLi) line = `<li>${line.replace(/^[-*]\s+/, '')}</li>`

    line = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" />')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')

    if (!isLi && !/^<h\d>/.test(line)) line = line ? `<p>${line}</p>` : '<br/>'
    html.push(line)
  }
  if (inList) html.push('</ul>')
  return html.join('\n')
}

export function Notes(): JSX.Element {
  const notes = useApp((s) => s.notes)
  const addNote = useApp((s) => s.addNote)
  const updateNote = useApp((s) => s.updateNote)
  const removeNote = useApp((s) => s.removeNote)

  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(notes[0]?.id ?? null)
  const [preview, setPreview] = useState(false)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return notes.filter(
      (n) =>
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    )
  }, [notes, query])

  const selected = notes.find((n) => n.id === selectedId) ?? null

  const createNote = async (): Promise<void> => {
    const note = await addNote({
      title: 'Untitled note',
      body: '',
      section: null,
      topic: null,
      resource: null,
      tags: [],
      pinned: false
    })
    setSelectedId(note.id)
    setPreview(false)
  }

  const addStarters = async (): Promise<void> => {
    for (const n of STARTER_NOTES) await addNote(n)
  }

  return (
    <div>
      <PageHeader
        title="Notes & Reference"
        subtitle="Markdown notes, tagged and searchable. Pin the important ones."
        actions={
          <>
            {notes.length === 0 && (
              <Button variant="ghost" onClick={addStarters}>
                <Sparkles size={16} /> Add Starter Sheets
              </Button>
            )}
            <Button onClick={createNote}>
              <Plus size={16} /> New Note
            </Button>
          </>
        }
      />

      {notes.length === 0 ? (
        <EmptyState
          icon={<FileText size={40} />}
          title="No notes yet"
          hint="Create a note, or load pre-built reference sheets for Physics, Biochem, Psych/Soc and CARS."
          action={<Button onClick={addStarters}><Sparkles size={16} /> Add Starter Sheets</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          {/* List */}
          <div>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-subtle" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes…" className="pl-10" />
            </div>
            <div className="scroll-area max-h-[640px] space-y-2 pr-1">
              {filtered.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setSelectedId(n.id)
                    setPreview(true)
                  }}
                  className={cn(
                    'card w-full p-3 text-left transition-all',
                    selectedId === n.id && 'ring-1 ring-accent'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {n.pinned && <Pin size={12} className="shrink-0 text-accent" />}
                    <span className="flex-1 truncate font-medium">{n.title}</span>
                    {n.section && <SectionTag section={n.section} />}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-content-subtle">
                    {n.body.replace(/[#*`]/g, '').slice(0, 100) || 'Empty note'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          {selected ? (
            <NoteEditor
              key={selected.id}
              note={selected}
              preview={preview}
              onTogglePreview={() => setPreview((v) => !v)}
              onSave={(patch) => updateNote(selected.id, patch)}
              onDelete={() => {
                removeNote(selected.id)
                setSelectedId(null)
              }}
            />
          ) : (
            <Card className="grid place-items-center text-content-subtle">Select a note</Card>
          )}
        </div>
      )}
    </div>
  )
}

function NoteEditor({
  note,
  preview,
  onTogglePreview,
  onSave,
  onDelete
}: {
  note: Note
  preview: boolean
  onTogglePreview: () => void
  onSave: (patch: Partial<Note>) => void
  onDelete: () => void
}): JSX.Element {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [tags, setTags] = useState(note.tags.join(', '))
  const [section, setSection] = useState<SectionKey | null>(note.section)

  // Debounced autosave on edits.
  useEffect(() => {
    const id = setTimeout(() => {
      onSave({ title, body, tags: tags.split(',').map((t) => t.trim()).filter(Boolean), section })
    }, 500)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, tags, section])

  return (
    <Card className="flex flex-col">
      <div className="mb-3 flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-transparent text-xl font-bold outline-none"
          placeholder="Note title"
        />
        <button
          onClick={() => onSave({ pinned: !note.pinned })}
          className="rounded-lg p-2 text-content-subtle hover:text-accent"
          title={note.pinned ? 'Unpin' : 'Pin'}
        >
          {note.pinned ? <PinOff size={18} /> : <Pin size={18} />}
        </button>
        <button onClick={onTogglePreview} className="rounded-lg p-2 text-content-subtle hover:text-content">
          {preview ? <Pencil size={18} /> : <Eye size={18} />}
        </button>
        <button onClick={onDelete} className="rounded-lg p-2 text-content-subtle hover:text-danger">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <SectionPicker value={section} onChange={setSection} />
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tags, comma separated"
          className="max-w-xs"
        />
      </div>

      {preview ? (
        <div
          className="markdown-body scroll-area max-h-[520px] flex-1 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
        />
      ) : (
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[480px] flex-1 font-mono text-sm leading-relaxed"
          placeholder="Write in markdown… # heading, **bold**, - lists, ![alt](image-url)"
        />
      )}
    </Card>
  )
}
