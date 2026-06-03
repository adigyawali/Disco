import { app, BrowserWindow, Notification, shell } from 'electron'
import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { initDb, getSettings, listSessions } from './db'
import { registerIpc } from './ipc/handlers'
import { buildMenu } from './menu'
import { format } from 'date-fns'

let mainWindow: BrowserWindow | null = null
let reminderTimer: NodeJS.Timeout | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1040,
    minHeight: 720,
    show: false,
    backgroundColor: '#060A08',
    titleBarStyle: 'hiddenInset', // native traffic lights over our custom topbar
    trafficLightPosition: { x: 18, y: 22 },
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false, // required so the preload can require the typed bridge
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  // Open external links in the default browser, never in-app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  buildMenu(mainWindow)
}

/**
 * Once a day (and shortly after launch) check whether the user has logged any
 * study today; if not and notifications are on, nudge them to protect the streak.
 */
function scheduleStreakReminder(): void {
  const check = (): void => {
    const settings = getSettings()
    if (!settings.notificationsEnabled || !Notification.isSupported()) return
    const today = format(new Date(), 'yyyy-MM-dd')
    const loggedToday = listSessions().some((s) => s.date === today)
    if (!loggedToday) {
      new Notification({
        title: 'Keep your streak alive 🔥',
        body: "You haven't logged any studying today. A short session counts!"
      }).show()
    }
  }
  // First check 30s after launch, then every 6 hours.
  setTimeout(check, 30_000)
  reminderTimer = setInterval(check, 6 * 60 * 60 * 1000)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.adigyawali.disco')

  // Initialize the local database under the OS app-data directory.
  initDb(join(app.getPath('userData'), 'disco.db'))
  registerIpc(() => app.getVersion())

  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  createWindow()
  scheduleStreakReminder()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (reminderTimer) clearInterval(reminderTimer)
  if (process.platform !== 'darwin') app.quit()
})
