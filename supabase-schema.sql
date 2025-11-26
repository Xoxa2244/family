-- Создание таблиц для Family Task Tracker

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица шаблонов дел
CREATE TABLE IF NOT EXISTS task_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  condition TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица назначений дел пользователям (many-to-many)
CREATE TABLE IF NOT EXISTS task_template_assignments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_template_id TEXT NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_template_id, user_id)
);

-- Таблица квот по дням недели
CREATE TABLE IF NOT EXISTS daily_quotas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  tasks_required INTEGER NOT NULL CHECK (tasks_required >= 0 AND tasks_required <= 3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, weekday)
);

-- Таблица инстансов дел
CREATE TABLE IF NOT EXISTS task_instances (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'moved')),
  move_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица для хранения текущего состояния приложения (current_user_id)
CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY DEFAULT 'main',
  current_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_task_instances_user_date ON task_instances(user_id, date);
CREATE INDEX IF NOT EXISTS idx_task_instances_status ON task_instances(status);
CREATE INDEX IF NOT EXISTS idx_daily_quotas_user_weekday ON daily_quotas(user_id, weekday);
CREATE INDEX IF NOT EXISTS idx_task_template_assignments_template ON task_template_assignments(task_template_id);
CREATE INDEX IF NOT EXISTS idx_task_template_assignments_user ON task_template_assignments(user_id);

-- Включить Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_template_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- Политики доступа: разрешить все операции для анонимных пользователей
-- (так как у нас простая авторизация без Supabase Auth)
CREATE POLICY "Allow all operations for anonymous users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON task_templates
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON task_template_assignments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON daily_quotas
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON task_instances
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON app_state
  FOR ALL USING (true) WITH CHECK (true);

