# Tasks

### T-001: Build React Flow canvas

- **Feature:** F-001
- **Pillar:** frontend
- **Status:** in_progress
- **Instructions for agent:**
  1. Implement pannable/zoomable canvas with React Flow and warm paper styling
  2. Render cards with type label, title, and body detail
  3. Wire layered layout — overview pillars and detail ring from spec loader
- **Done when:** All acceptance criteria for F-001 pass on load from spec

### T-002: Wire intent pipeline on chat submit

- **Feature:** F-002
- **Pillar:** frontend
- **Status:** in_progress
- **Instructions for agent:**
  1. Connect chat bar to `action:intent` edge function
  2. Show preview diff on canvas and summary in side panel
  3. Implement commit and discard actions against preview row
- **Done when:** All acceptance criteria for F-002 pass end-to-end with InsForge API

### T-003: Spec export on commit

- **Feature:** F-002
- **Pillar:** backend
- **Status:** done
- **Instructions for agent:**
  1. Assemble full nine-file spec tree from spec_sections on commit
  2. Run validate-spec before write; return exportedSpec in response
  3. Provide `npm run write:spec` helper for repo sync
- **Done when:** Commit returns valid exportedSpec; write:spec updates repo spec/

### T-004: App shell & resizable layout

- **Feature:** F-004
- **Pillar:** frontend
- **Status:** in_progress
- **Instructions for agent:**
  1. Implement AppShell with canvas main area and side panel split
  2. Add ResizeHandle for panel width (desktop) and height (mobile breakpoint)
  3. Persist layout sizes in localStorage via useResizableSize
- **Done when:** All acceptance criteria for F-004 pass on desktop and narrow viewport

### T-005: Side panel tabs

- **Feature:** F-004
- **Pillar:** frontend
- **Status:** in_progress
- **Instructions for agent:**
  1. Build SidePanel with Build plan and Card editor tabs
  2. Auto-switch to Card editor when user selects a canvas card
  3. Show PreviewActions and resizable preview summary when preview active
- **Done when:** Tab switching, preview actions, and summary resize work with F-002 preview flow

### T-006: Chat bar UI

- **Feature:** F-002
- **Pillar:** frontend
- **Status:** in_progress
- **Instructions for agent:**
  1. Floating chat bar on canvas with draft state in Zustand store
  2. Enter submits; Shift+Enter newline; circular submit/stop control
  3. Disable submit while translator is running
- **Done when:** Chat bar submits to submitChat and respects isTranslating state

### T-007: Card visualization embeds

- **Feature:** F-005
- **Pillar:** frontend
- **Status:** in_progress
- **Instructions for agent:**
  1. Implement VizEmbed with Mermaid, data-table, markdown-table, force-graph, progress-checklist
  2. Wire vizType and vizPayload on CardNode from card data
  3. Size CardNode layout boxes for viz-heavy cards in layout.ts
- **Done when:** All acceptance criteria for F-005 pass for P0 viz types

### T-008: Canvas navigation & delete mode

- **Feature:** F-001
- **Pillar:** frontend
- **Status:** in_progress
- **Instructions for agent:**
  1. Pillar double-click drills overview ↔ detail; LayerStackIndicator returns to overview
  2. Long-press enters delete mode with trash drop zone; Escape exits
  3. Animated layer transitions and fitView on drill change
- **Done when:** Drill, delete mode, and nav panel match canvas-ui-vision layer model

### T-009: TipTap card editor & spec file panel

- **Feature:** F-003
- **Pillar:** frontend
- **Status:** proposed
- **Instructions for agent:**
  1. CardEditor with TipTap for title and body inline editing
  2. SpecFilePanel shows assembled markdown for selected card's spec file
  3. updateCard syncs edits to canvas store and patch-card API
- **Done when:** All acceptance criteria for F-003 pass with spec file preview visible
