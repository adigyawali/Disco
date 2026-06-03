// ============================================================================
// SQLite schema. Executed once on startup (idempotent — IF NOT EXISTS).
// Booleans are stored as INTEGER 0/1. Dates are TEXT (ISO 'YYYY-MM-DD' or full).
// JSON columns (tags, goals, hours) store stringified JSON.
// ============================================================================

export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

-- Single-row settings table (enforced id = 1).
CREATE TABLE IF NOT EXISTS settings (
  id                    INTEGER PRIMARY KEY CHECK (id = 1),
  test_date             TEXT,
  target_total          INTEGER NOT NULL DEFAULT 515,
  target_cp             INTEGER NOT NULL DEFAULT 129,
  target_cars           INTEGER NOT NULL DEFAULT 129,
  target_bb             INTEGER NOT NULL DEFAULT 129,
  target_ps             INTEGER NOT NULL DEFAULT 128,
  daily_goal_minutes    INTEGER NOT NULL DEFAULT 180,
  theme                 TEXT NOT NULL DEFAULT 'dark',
  notifications_enabled INTEGER NOT NULL DEFAULT 1,
  remember_me           INTEGER NOT NULL DEFAULT 0,
  onboarded             INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  date         TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  section      TEXT,
  topic        TEXT,
  resource     TEXT,
  notes        TEXT,
  focus        INTEGER NOT NULL DEFAULT 3,
  energy       INTEGER NOT NULL DEFAULT 3,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_topics (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  section     TEXT NOT NULL,
  subject     TEXT NOT NULL,
  name        TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS content_progress (
  topic_id   INTEGER PRIMARY KEY REFERENCES content_topics(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'not_started',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS question_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  date          TEXT NOT NULL,
  resource      TEXT,
  section       TEXT,
  topic         TEXT,
  attempted     INTEGER NOT NULL,
  correct       INTEGER NOT NULL,
  time_spent_min INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exams (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT NOT NULL,
  source     TEXT NOT NULL,
  score_cp   INTEGER,
  score_cars INTEGER,
  score_bb   INTEGER,
  score_ps   INTEGER,
  total      INTEGER,
  feeling    INTEGER,
  notes      TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plan_weeks (
  week_index INTEGER PRIMARY KEY,
  start_date TEXT NOT NULL,
  end_date   TEXT NOT NULL,
  phase      TEXT NOT NULL,
  focus      TEXT NOT NULL,
  hours      TEXT NOT NULL, -- JSON Record<SectionKey, number>
  goals      TEXT NOT NULL  -- JSON PlanGoal[]
);

CREATE TABLE IF NOT EXISTS tasks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  due_date   TEXT NOT NULL,
  section    TEXT,
  type       TEXT NOT NULL DEFAULT 'task',
  completed  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  section    TEXT,
  topic      TEXT,
  resource   TEXT,
  tags       TEXT NOT NULL DEFAULT '[]',
  pinned     INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS anki_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT NOT NULL,
  deck       TEXT,
  reviews    INTEGER NOT NULL DEFAULT 0,
  new_cards  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_date  ON study_sessions(date);
CREATE INDEX IF NOT EXISTS idx_questions_date ON question_logs(date);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON question_logs(topic);
CREATE INDEX IF NOT EXISTS idx_exams_date     ON exams(date);
CREATE INDEX IF NOT EXISTS idx_tasks_due      ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_anki_date      ON anki_logs(date);
`
