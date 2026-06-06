# Features

### F-001: Intent canvas

- **Status:** in_progress
- **Priority:** high
- **Description:** Users arrange cards on a pannable, zoomable canvas with links between intent nodes. Overview shows Product · Frontend · Backend pillars; drill into Frontend for implementation tasks.
- **Acceptance criteria:**
  - Canvas loads cards from `spec/*.md` on startup
  - Overview shows three pillars; detail cards appear when drilling a pillar
  - Pan and zoom for reading; edges show relationships
- **Related:** architecture.md (Canvas IA), tasks.md (T-001, T-008)

### F-002: Chat → preview → commit

- **Status:** in_progress
- **Priority:** high
- **Description:** User submits natural language in the chat bar; translator runs once and returns a preview diff. User commits or discards before spec changes apply.
- **Acceptance criteria:**
  - Preview shows ghost cards and dashed edges
  - Commit writes Postgres + exports full spec tree
  - Discard removes preview without changing committed state
- **Related:** tasks.md (T-002, T-006)

### F-003: Manual card editing

- **Status:** proposed
- **Priority:** medium
- **Description:** Users select a card and edit title/body in the side panel without going through chat.
- **Acceptance criteria:**
  - Single-click selects card; side panel shows TipTap editor
  - patch-card syncs card body to spec_sections
  - Next commit re-exports updated markdown
- **Related:** tasks.md (T-009)

### F-004: IDE shell & resizable panels

- **Status:** in_progress
- **Priority:** medium
- **Description:** Canvas, side panel, and preview summary use drag-to-resize borders with sizes persisted in localStorage. Responsive layout stacks panel below canvas on narrow viewports.
- **Acceptance criteria:**
  - User can resize canvas vs side panel width (desktop) or height (mobile)
  - Preview summary height resizable in card editor tab when preview active
  - Layout sizes survive page reload
- **Related:** tasks.md (T-004, T-005)

### F-005: Rich card visualizations

- **Status:** in_progress
- **Priority:** medium
- **Description:** Cards optionally embed structured visuals — Mermaid diagrams, data tables, force graphs, markdown tables, and progress checklists — chosen per card type.
- **Acceptance criteria:**
  - VizEmbed renders supported viz types on CardNode
  - Embeds stay readable on milky paper canvas styling
  - Viz payload syncs from card data without breaking spec export
- **Related:** tasks.md (T-007)

### F-006: Execution plan panel (Build plan)

- **Status:** done
- **Priority:** low
- **Description:** Side panel Build plan tab regenerates execution phases from all Flow B spec MDs (fresh each time). Preview → commit replaces stored plan; task checkboxes persist per planVersion in localStorage.
- **Acceptance criteria:**
  - Regenerate reads full spec and produces phased task groupings
  - Preview banner with Commit / Discard before persistence
  - Active phase and next task highlighted; progress checkboxes in localStorage
- **Related:** tasks.md (T-005)
