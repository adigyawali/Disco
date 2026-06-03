import { Download, FileJson, LogOut, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@renderer/components/ui/Misc'
import { Card, CardTitle } from '@renderer/components/ui/Card'
import { Button } from '@renderer/components/ui/Button'
import { Field, Input, Toggle } from '@renderer/components/ui/Form'
import { Modal } from '@renderer/components/ui/Modal'
import { useApp } from '@renderer/stores/app'
import { useAuth } from '@renderer/stores/auth'
import { useTheme } from '@renderer/stores/theme'
import { api } from '@renderer/lib/utils'
import { SECTIONS, SECTION_SCORE_MAX, SECTION_SCORE_MIN } from '@shared/types'
import { useEffect } from 'react'

export function SettingsPage(): JSX.Element {
  const settings = useApp((s) => s.settings)
  const updateSettings = useApp((s) => s.updateSettings)
  const loadCore = useApp((s) => s.loadCore)
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const { theme, set: setTheme } = useTheme()

  const [version, setVersion] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    void api.system.version().then(setVersion)
  }, [])

  if (!settings) return <div />

  const targetKey = (k: string): 'targetCp' | 'targetCars' | 'targetBb' | 'targetPs' =>
    ({ cp: 'targetCp', cars: 'targetCars', bb: 'targetBb', ps: 'targetPs' })[k] as never

  const targetTotal = SECTIONS.reduce((a, s) => a + (settings[targetKey(s.key)] as number), 0)

  const flash = (msg: string): void => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const exportJson = async (): Promise<void> => {
    const r = await api.data.exportJson()
    if (r.ok) flash('Backup exported ✓')
  }
  const exportCsv = async (): Promise<void> => {
    const r = await api.data.exportCsv()
    if (r.ok) flash('Sessions CSV exported ✓')
  }
  const doReset = async (): Promise<void> => {
    await api.data.reset()
    await loadCore()
    setResetOpen(false)
    flash('All study data cleared')
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Everything stays local on this Mac." />

      <div className="space-y-5">
        {/* Profile */}
        <Card>
          <CardTitle>Profile</CardTitle>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name">
              <Input value={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()} disabled />
            </Field>
            <Field label="MCAT Test Date">
              <Input
                type="date"
                value={settings.testDate ?? ''}
                onChange={(e) => updateSettings({ testDate: e.target.value || null })}
              />
            </Field>
          </div>
        </Card>

        {/* Targets */}
        <Card>
          <CardTitle right={<span className="text-sm font-bold">Total {targetTotal}</span>}>
            Score Targets
          </CardTitle>
          <div className="space-y-3">
            {SECTIONS.map((s) => (
              <div key={s.key} className="flex items-center gap-4">
                <span className="w-12 text-sm font-semibold" style={{ color: s.color }}>{s.short}</span>
                <input
                  type="range"
                  min={SECTION_SCORE_MIN}
                  max={SECTION_SCORE_MAX}
                  value={settings[targetKey(s.key)] as number}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    // Recompute the total with this section's new value applied.
                    const newTotal = SECTIONS.reduce(
                      (a, x) => a + (x.key === s.key ? v : (settings[targetKey(x.key)] as number)),
                      0
                    )
                    void updateSettings({ [targetKey(s.key)]: v, targetTotal: newTotal } as never)
                  }}
                  className="flex-1 accent-[rgb(var(--accent))]"
                />
                <span className="w-10 text-right font-bold">{settings[targetKey(s.key)] as number}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Goal + preferences */}
        <Card>
          <CardTitle>Preferences</CardTitle>
          <div className="space-y-5">
            <Field label={`Daily study goal: ${Math.round((settings.dailyGoalMinutes / 60) * 10) / 10}h`}>
              <input
                type="range"
                min={30}
                max={600}
                step={15}
                value={settings.dailyGoalMinutes}
                onChange={(e) => updateSettings({ dailyGoalMinutes: Number(e.target.value) })}
                className="w-full accent-[rgb(var(--accent))]"
              />
            </Field>
            <Row label="Dark mode" hint="Toggle between dark and light themes.">
              <Toggle checked={theme === 'dark'} onChange={(v) => setTheme(v ? 'dark' : 'light')} />
            </Row>
            <Row label="Study reminders" hint="macOS notifications to protect your streak.">
              <Toggle
                checked={settings.notificationsEnabled}
                onChange={(v) => updateSettings({ notificationsEnabled: v })}
              />
            </Row>
          </div>
        </Card>

        {/* Data */}
        <Card>
          <CardTitle>Data</CardTitle>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={exportJson}>
              <FileJson size={16} /> Export JSON Backup
            </Button>
            <Button variant="ghost" onClick={exportCsv}>
              <Download size={16} /> Export Sessions CSV
            </Button>
            <Button variant="danger" onClick={() => setResetOpen(true)}>
              <RotateCcw size={16} /> Reset Data
            </Button>
          </div>
        </Card>

        {/* Account */}
        <Card>
          <CardTitle>Account</CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-content-subtle">Disco v{version} · all data local</p>
            <Button variant="ghost" onClick={logout}>
              <LogOut size={16} /> Lock & Sign Out
            </Button>
          </div>
        </Card>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-accent-gradient px-5 py-3 text-sm font-medium text-white shadow-glow">
          {toast}
        </div>
      )}

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset all study data?"
        width={440}
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={doReset}>
              <Trash2 size={16} /> Yes, clear everything
            </Button>
          </>
        }
      >
        <p className="text-sm text-content-muted">
          This permanently deletes all study sessions, question logs, exams, tasks, notes, Anki logs,
          and your study plan. Your account, settings, and the content outline are kept. This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

function Row({
  label,
  hint,
  children
}: {
  label: string
  hint?: string
  children: React.ReactNode
}): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-content">{label}</p>
        {hint && <p className="text-xs text-content-subtle">{hint}</p>}
      </div>
      {children}
    </div>
  )
}
