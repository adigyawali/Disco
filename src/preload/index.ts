import { contextBridge, ipcRenderer } from 'electron'
import type { DiscoApi } from '../shared/types'

// Thin typed wrapper over ipcRenderer.invoke. The renderer only ever sees this
// object (window.api) — it has no access to Node, fs, or ipcRenderer directly.
const api: DiscoApi = {
  auth: {
    state: () => ipcRenderer.invoke('auth:state'),
    signup: (input) => ipcRenderer.invoke('auth:signup', input),
    login: (password, remember) => ipcRenderer.invoke('auth:login', password, remember),
    logout: () => ipcRenderer.invoke('auth:logout'),
    resume: () => ipcRenderer.invoke('auth:resume')
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (patch) => ipcRenderer.invoke('settings:update', patch)
  },
  sessions: {
    list: () => ipcRenderer.invoke('sessions:list'),
    add: (input) => ipcRenderer.invoke('sessions:add', input),
    remove: (id) => ipcRenderer.invoke('sessions:remove', id)
  },
  content: {
    list: () => ipcRenderer.invoke('content:list'),
    setStatus: (topicId, status) => ipcRenderer.invoke('content:setStatus', topicId, status)
  },
  questions: {
    list: () => ipcRenderer.invoke('questions:list'),
    add: (input) => ipcRenderer.invoke('questions:add', input),
    remove: (id) => ipcRenderer.invoke('questions:remove', id)
  },
  exams: {
    list: () => ipcRenderer.invoke('exams:list'),
    add: (input) => ipcRenderer.invoke('exams:add', input),
    update: (id, patch) => ipcRenderer.invoke('exams:update', id, patch),
    remove: (id) => ipcRenderer.invoke('exams:remove', id)
  },
  plan: {
    get: () => ipcRenderer.invoke('plan:get'),
    generate: () => ipcRenderer.invoke('plan:generate'),
    setGoal: (weekIndex, goalId, done) => ipcRenderer.invoke('plan:setGoal', weekIndex, goalId, done)
  },
  tasks: {
    list: () => ipcRenderer.invoke('tasks:list'),
    add: (input) => ipcRenderer.invoke('tasks:add', input),
    update: (id, patch) => ipcRenderer.invoke('tasks:update', id, patch),
    remove: (id) => ipcRenderer.invoke('tasks:remove', id)
  },
  notes: {
    list: () => ipcRenderer.invoke('notes:list'),
    add: (input) => ipcRenderer.invoke('notes:add', input),
    update: (id, patch) => ipcRenderer.invoke('notes:update', id, patch),
    remove: (id) => ipcRenderer.invoke('notes:remove', id)
  },
  anki: {
    list: () => ipcRenderer.invoke('anki:list'),
    add: (input) => ipcRenderer.invoke('anki:add', input),
    remove: (id) => ipcRenderer.invoke('anki:remove', id)
  },
  dashboard: {
    summary: () => ipcRenderer.invoke('dashboard:summary'),
    quoteOfDay: () => ipcRenderer.invoke('dashboard:quoteOfDay')
  },
  analytics: {
    bundle: () => ipcRenderer.invoke('analytics:bundle')
  },
  data: {
    exportJson: () => ipcRenderer.invoke('data:exportJson'),
    exportCsv: () => ipcRenderer.invoke('data:exportCsv'),
    reset: () => ipcRenderer.invoke('data:reset')
  },
  system: {
    notify: (title, body) => ipcRenderer.invoke('system:notify', title, body),
    version: () => ipcRenderer.invoke('system:version')
  }
}

contextBridge.exposeInMainWorld('api', api)
