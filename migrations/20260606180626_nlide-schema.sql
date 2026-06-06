-- NLIDE schema: projects, canvas, spec sections, previews

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  center_card_id TEXT NOT NULL DEFAULT 'index',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cards (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  spec_file TEXT NOT NULL,
  spec_anchor TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  viz_type TEXT,
  viz_payload JSONB,
  status TEXT,
  PRIMARY KEY (project_id, id)
);

CREATE TABLE IF NOT EXISTS canvas_edges (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  label TEXT,
  PRIMARY KEY (project_id, id)
);

CREATE TABLE IF NOT EXISTS spec_sections (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file TEXT NOT NULL,
  anchor TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (project_id, file, anchor)
);

CREATE TABLE IF NOT EXISTS previews (
  id TEXT PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_project ON cards(project_id);
CREATE INDEX IF NOT EXISTS idx_edges_project ON canvas_edges(project_id);
CREATE INDEX IF NOT EXISTS idx_spec_project ON spec_sections(project_id);
CREATE INDEX IF NOT EXISTS idx_previews_project ON previews(project_id);

-- v0: permissive policies (tighten before production)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE spec_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE previews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nlide_v0_projects_all" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "nlide_v0_cards_all" ON cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "nlide_v0_edges_all" ON canvas_edges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "nlide_v0_spec_all" ON spec_sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "nlide_v0_previews_all" ON previews FOR ALL USING (true) WITH CHECK (true);

-- Default hackathon project (idempotent)
INSERT INTO projects (id, name, center_card_id)
VALUES ('00000000-0000-4000-8000-000000000001', 'NLIDE Demo Project', 'index')
ON CONFLICT (id) DO NOTHING;
