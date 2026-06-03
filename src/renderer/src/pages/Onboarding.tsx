import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CalendarHeart, GraduationCap, Sparkles, Target } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@renderer/stores/auth'
import { Button } from '@renderer/components/ui/Button'
import { Field, Input, Toggle } from '@renderer/components/ui/Form'
import { api, clamp } from '@renderer/lib/utils'
import { SECTIONS, SECTION_SCORE_MAX, SECTION_SCORE_MIN } from '@shared/types'

const STEPS = ['Account', 'Test Date', 'Targets', 'Plan'] as const

export function Onboarding(): JSX.Element {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)

  // Collected data
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [testDate, setTestDate] = useState('')
  const [dailyHours, setDailyHours] = useState(3)
  const [targets, setTargets] = useState<Record<string, number>>({ cp: 129, cars: 129, bb: 129, ps: 128 })
  const [autoPlan, setAutoPlan] = useState(true)
  const [busy, setBusy] = useState(false)

  const targetTotal = SECTIONS.reduce((a, s) => a + targets[s.key], 0)

  const go = (delta: number): void => {
    setDir(delta)
    setStep((s) => clamp(s + delta, 0, STEPS.length - 1))
  }

  const canContinue = (): boolean => {
    if (step === 0) return firstName.trim().length > 0 && password.length >= 4 && password === confirm
    return true
  }

  const finish = async (): Promise<void> => {
    setBusy(true)
    // Create the account and settings via the API directly, THEN flip auth phase,
    // so onboarding data is fully persisted before the shell mounts.
    const user = await api.auth.signup({ firstName, lastName, password })
    await api.settings.update({
      testDate: testDate || null,
      dailyGoalMinutes: Math.round(dailyHours * 60),
      targetCp: targets.cp,
      targetCars: targets.cars,
      targetBb: targets.bb,
      targetPs: targets.ps,
      targetTotal,
      onboarded: true,
      rememberMe: true
    })
    if (autoPlan) await api.plan.generate()
    useAuth.setState({ phase: 'authed', user })
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-xl overflow-hidden p-0"
      >
        {/* Header + step rail */}
        <div className="border-b border-border px-8 pb-5 pt-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-gradient shadow-glow">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Welcome to Disco</h1>
              <p className="text-sm text-content-muted">Set up your account to get started.</p>
            </div>
          </div>
          <div className="flex gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-accent' : 'bg-surface-2'}`}
                />
                <span
                  className={`mt-1.5 block text-[11px] ${i === step ? 'text-content' : 'text-content-subtle'}`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[280px] px-8 py-7">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="First Name">
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
                    </Field>
                    <Field label="Last Name">
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Password" hint="Used to lock the app locally. Minimum 4 characters.">
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </Field>
                  <Field label="Confirm password">
                    <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                  </Field>
                  {confirm && password !== confirm && (
                    <p className="text-sm text-danger">Passwords don't match.</p>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-accent">
                    <CalendarHeart size={20} />
                    <h2 className="text-lg font-semibold text-content">When is test day?</h2>
                  </div>
                  <Field label="MCAT test date" hint="We'll build a week-by-week plan and count down for you. You can skip this.">
                    <Input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
                  </Field>
                  <Field label={`Daily study goal: ${dailyHours}h`}>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={0.5}
                      value={dailyHours}
                      onChange={(e) => setDailyHours(Number(e.target.value))}
                      className="w-full accent-[rgb(var(--accent))]"
                    />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-accent">
                    <Target size={20} />
                    <h2 className="text-lg font-semibold text-content">Score targets</h2>
                  </div>
                  <div className="space-y-4">
                    {SECTIONS.map((s) => (
                      <div key={s.key} className="flex items-center gap-4">
                        <span className="w-12 text-sm font-semibold" style={{ color: s.color }}>
                          {s.short}
                        </span>
                        <input
                          type="range"
                          min={SECTION_SCORE_MIN}
                          max={SECTION_SCORE_MAX}
                          value={targets[s.key]}
                          onChange={(e) =>
                            setTargets((t) => ({ ...t, [s.key]: Number(e.target.value) }))
                          }
                          className="flex-1 accent-[rgb(var(--accent))]"
                        />
                        <span className="w-10 text-right font-bold">{targets[s.key]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-accent-gradient/10 px-4 py-3 text-center">
                    <span className="text-sm text-content-muted">Target total: </span>
                    <span className="text-2xl font-bold">{targetTotal}</span>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-accent">
                    <Sparkles size={20} />
                    <h2 className="text-lg font-semibold text-content">Study plan</h2>
                  </div>
                  <p className="text-sm text-content-muted">
                    Generate a phased plan (content → practice → full-lengths → review) based on your
                    test date, weighted toward weaker sections as you log data.
                  </p>
                  <div className="flex items-center justify-between rounded-xl bg-surface-2/50 px-4 py-3">
                    <div>
                      <p className="font-medium text-content">Auto-generate my plan</p>
                      <p className="text-xs text-content-subtle">
                        {testDate ? 'Based on your test date.' : 'A default 12-week plan (no date set).'}
                      </p>
                    </div>
                    <Toggle checked={autoPlan} onChange={setAutoPlan} />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t border-border px-8 py-4">
          <Button variant="ghost" onClick={() => go(-1)} disabled={step === 0}>
            <ArrowLeft size={16} /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => go(1)} disabled={!canContinue()}>
              Continue <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={finish} disabled={busy}>
              {busy ? 'Setting up…' : 'Get Started'} <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
