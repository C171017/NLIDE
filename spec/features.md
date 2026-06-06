# Features

### F-001: Intent canvas

- **Status:** in_progress
- **Priority:** high
- **Description:** Users arrange cards on a pannable, zoomable canvas with links between intent nodes. Overview shows the full project graph loaded from spec markdown.
- **Acceptance criteria:**
  - Canvas loads cards from `spec/*.md` on startup
  - All cards visible on overview layer (type, title, detail format)
  - Pan and zoom for reading; edges show relationships
- **Related:** architecture.md (Canvas IA)

### F-002: Chat → preview → commit

- **Status:** in_progress
- **Priority:** high
- **Description:** User submits natural language in the chat bar; translator runs once and returns a preview diff. User commits or discards before spec changes apply.
- **Acceptance criteria:**
  - Preview shows ghost cards and dashed edges
  - Commit writes Postgres + exports full spec tree
  - Discard removes preview without changing committed state
- **Related:** tasks.md (T-002)

### F-003: Manual card editing

- **Status:** proposed
- **Priority:** medium
- **Description:** Users select a card and edit title/body in the side panel without going through chat.
- **Acceptance criteria:**
  - Single-click selects card; side panel shows TipTap editor
  - patch-card syncs card body to spec_sections
  - Next commit re-exports updated markdown
- **Related:** —
