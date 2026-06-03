import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '@renderer/stores/auth'
import { useApp } from '@renderer/stores/app'
import { useTheme } from '@renderer/stores/theme'
import { AppShell } from '@renderer/components/layout/AppShell'
import { Splash } from '@renderer/pages/Splash'
import { Login } from '@renderer/pages/Login'
import { Onboarding } from '@renderer/pages/Onboarding'
import { Dashboard } from '@renderer/pages/Dashboard'
import { Sessions } from '@renderer/pages/Sessions'
import { ContentReview } from '@renderer/pages/ContentReview'
import { Questions } from '@renderer/pages/Questions'
import { Exams } from '@renderer/pages/Exams'
import { Plan } from '@renderer/pages/Plan'
import { CalendarPage } from '@renderer/pages/CalendarPage'
import { Analytics } from '@renderer/pages/Analytics'
import { Notes } from '@renderer/pages/Notes'
import { Anki } from '@renderer/pages/Anki'
import { SettingsPage } from '@renderer/pages/SettingsPage'

export default function App(): JSX.Element {
  const phase = useAuth((s) => s.phase)
  const init = useAuth((s) => s.init)

  useEffect(() => {
    void init()
  }, [init])

  if (phase === 'loading') return <Splash />
  if (phase === 'signup') return <Onboarding />
  if (phase === 'login') return <Login />
  return <AuthedApp />
}

/** Loads all data + hydrates theme before rendering the shell. */
function AuthedApp(): JSX.Element {
  const loadCore = useApp((s) => s.loadCore)
  const settings = useApp((s) => s.settings)
  const hydrateTheme = useTheme((s) => s.hydrate)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void loadCore().then(() => setReady(true))
  }, [loadCore])

  useEffect(() => {
    if (settings) hydrateTheme(settings.theme)
  }, [settings, hydrateTheme])

  if (!ready) return <Splash />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/content" element={<ContentReview />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/exams" element={<Exams />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/anki" element={<Anki />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
