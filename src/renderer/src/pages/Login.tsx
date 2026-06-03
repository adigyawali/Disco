import { motion } from 'framer-motion'
import { GraduationCap, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@renderer/stores/auth'
import { Button } from '@renderer/components/ui/Button'
import { Toggle } from '@renderer/components/ui/Form'
import { api } from '@renderer/lib/utils'

/** Returning-user login. */
export function Login(): JSX.Element {
  const login = useAuth((s) => s.login)
  const error = useAuth((s) => s.error)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void api.auth.state().then((s) => s.user && setName(s.user.firstName))
  }, [])

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setBusy(true)
    await login(password, remember)
    setBusy(false)
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="card w-full max-w-md p-8"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-accent-gradient shadow-glow"
        >
          <GraduationCap size={32} className="text-white" />
        </motion.div>

        <h1 className="text-center text-2xl font-bold tracking-tight">
          Welcome back{name ? `, ${name}` : ''}
        </h1>
        <p className="mb-7 mt-1 text-center text-sm text-content-muted">
          Enter your password to continue studying.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <Lock
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-subtle"
            />
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input pl-11"
            />
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-danger">
              {error}
            </motion.p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-content-muted">Remember me</span>
            <Toggle checked={remember} onChange={setRemember} />
          </div>

          <Button type="submit" disabled={busy || !password} className="w-full">
            {busy ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
