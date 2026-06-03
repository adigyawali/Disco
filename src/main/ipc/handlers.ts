import { dialog, ipcMain, Notification } from 'electron'
import { writeFileSync } from 'fs'
import bcrypt from 'bcryptjs'
import * as db from '../db'
import { analyticsBundle, dashboardSummary, quoteOfDay } from '../services/analytics'
import { generatePlan } from '../services/plan'
import type {
  AuthState,
  Settings,
  SignupInput,
  User
} from '../../shared/types'

// In-memory auth gate. "remember me" persists across launches via settings.
let currentUser: User | null = null

/**
 * Registers every IPC channel. Channel names mirror the DiscoApi surface
 * ('namespace:method'). The preload bridge invokes these by the same names.
 */
export function registerIpc(getAppVersion: () => string): void {
  // ---- auth ----
  ipcMain.handle('auth:state', (): AuthState => ({
    hasAccount: !!db.getUser(),
    user: currentUser
  }))

  ipcMain.handle('auth:signup', async (_e, input: SignupInput): Promise<User> => {
    const hash = await bcrypt.hash(input.password, 10)
    const user = db.createUser(input.firstName.trim(), input.lastName.trim(), hash)
    currentUser = user
    return user
  })

  ipcMain.handle('auth:login', async (_e, password: string, remember: boolean): Promise<User | null> => {
    const row = db.getUserRow()
    if (!row) return null
    const ok = await bcrypt.compare(password, row.password_hash)
    if (!ok) return null
    currentUser = db.getUser()
    db.updateSettings({ rememberMe: remember })
    return currentUser
  })

  ipcMain.handle('auth:logout', (): void => {
    currentUser = null
    db.updateSettings({ rememberMe: false })
  })

  ipcMain.handle('auth:resume', (): User | null => {
    const settings = db.getSettings()
    if (settings.rememberMe && db.getUser()) {
      currentUser = db.getUser()
      return currentUser
    }
    return null
  })

  // ---- settings ----
  ipcMain.handle('settings:get', (): Settings => db.getSettings())
  ipcMain.handle('settings:update', (_e, patch: Partial<Settings>): Settings => db.updateSettings(patch))

  // ---- study sessions ----
  ipcMain.handle('sessions:list', () => db.listSessions())
  ipcMain.handle('sessions:add', (_e, input) => db.addSession(input))
  ipcMain.handle('sessions:remove', (_e, id: number) => db.removeSession(id))

  // ---- content ----
  ipcMain.handle('content:list', () => db.listContentWithProgress())
  ipcMain.handle('content:setStatus', (_e, topicId: number, status) =>
    db.setContentStatus(topicId, status)
  )

  // ---- questions ----
  ipcMain.handle('questions:list', () => db.listQuestions())
  ipcMain.handle('questions:add', (_e, input) => db.addQuestion(input))
  ipcMain.handle('questions:remove', (_e, id: number) => db.removeQuestion(id))

  // ---- exams ----
  ipcMain.handle('exams:list', () => db.listExams())
  ipcMain.handle('exams:add', (_e, input) => db.addExam(input))
  ipcMain.handle('exams:update', (_e, id: number, patch) => db.updateExam(id, patch))
  ipcMain.handle('exams:remove', (_e, id: number) => db.removeExam(id))

  // ---- plan ----
  ipcMain.handle('plan:get', () => db.getPlan())
  ipcMain.handle('plan:generate', () => generatePlan())
  ipcMain.handle('plan:setGoal', (_e, weekIndex: number, goalId: string, done: boolean) =>
    db.setPlanGoal(weekIndex, goalId, done)
  )

  // ---- tasks ----
  ipcMain.handle('tasks:list', () => db.listTasks())
  ipcMain.handle('tasks:add', (_e, input) => db.addTask(input))
  ipcMain.handle('tasks:update', (_e, id: number, patch) => db.updateTask(id, patch))
  ipcMain.handle('tasks:remove', (_e, id: number) => db.removeTask(id))

  // ---- notes ----
  ipcMain.handle('notes:list', () => db.listNotes())
  ipcMain.handle('notes:add', (_e, input) => db.addNote(input))
  ipcMain.handle('notes:update', (_e, id: number, patch) => db.updateNote(id, patch))
  ipcMain.handle('notes:remove', (_e, id: number) => db.removeNote(id))

  // ---- anki ----
  ipcMain.handle('anki:list', () => db.listAnki())
  ipcMain.handle('anki:add', (_e, input) => db.addAnki(input))
  ipcMain.handle('anki:remove', (_e, id: number) => db.removeAnki(id))

  // ---- dashboard + analytics ----
  ipcMain.handle('dashboard:summary', () => dashboardSummary())
  ipcMain.handle('dashboard:quoteOfDay', () => quoteOfDay())
  ipcMain.handle('analytics:bundle', () => analyticsBundle())

  // ---- data export / reset ----
  ipcMain.handle('data:exportJson', async () => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export Disco data',
      defaultPath: `disco-backup-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (canceled || !filePath) return { ok: false }
    writeFileSync(filePath, JSON.stringify(db.exportAll(), null, 2), 'utf-8')
    return { ok: true, path: filePath }
  })

  ipcMain.handle('data:exportCsv', async () => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export study sessions (CSV)',
      defaultPath: `disco-sessions-${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })
    if (canceled || !filePath) return { ok: false }
    const rows = db.listSessions()
    const header = 'date,duration_min,section,topic,resource,focus,energy,notes\n'
    const body = rows
      .map((r) =>
        [
          r.date,
          r.durationMin,
          r.section ?? '',
          r.topic ?? '',
          r.resource ?? '',
          r.focus,
          r.energy,
          `"${(r.notes ?? '').replace(/"/g, '""')}"`
        ].join(',')
      )
      .join('\n')
    writeFileSync(filePath, header + body, 'utf-8')
    return { ok: true, path: filePath }
  })

  ipcMain.handle('data:reset', () => {
    db.resetData()
  })

  // ---- system ----
  ipcMain.handle('system:notify', (_e, title: string, body: string) => {
    if (db.getSettings().notificationsEnabled && Notification.isSupported()) {
      new Notification({ title, body }).show()
    }
  })
  ipcMain.handle('system:version', () => getAppVersion())
}
