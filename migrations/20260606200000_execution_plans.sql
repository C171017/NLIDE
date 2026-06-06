-- Execution plan storage (outside Flow B spec allowlist)

CREATE TABLE IF NOT EXISTS execution_plans (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS execution_plan_previews (
  id TEXT PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execution_plan_previews_project
  ON execution_plan_previews(project_id);

ALTER TABLE execution_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_plan_previews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nlide_v0_execution_plans_all" ON execution_plans
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "nlide_v0_execution_plan_previews_all" ON execution_plan_previews
  FOR ALL USING (true) WITH CHECK (true);
