-- ============================================
-- Migration 014: Tasks (To-do list)
-- Wedding planning to-do tracker, styled like
-- the incidents list (add + check off).
-- ============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  done BOOLEAN NOT NULL DEFAULT false,
  done_at TIMESTAMPTZ,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'low'
    CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_wedding ON tasks(wedding_id);
CREATE INDEX idx_tasks_done ON tasks(done);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ============================================
-- Triggers: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to tasks"
  ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon cannot access tasks"
  ON tasks FOR SELECT TO anon USING (false);

GRANT ALL ON TABLE tasks TO authenticated, service_role;
GRANT SELECT ON TABLE tasks TO anon;
