# Tasks

### T-001: Build React Flow canvas

- **Feature:** F-001
- **Status:** in_progress
- **Instructions for agent:**
  1. Implement pannable/zoomable canvas with React Flow and warm paper styling
  2. Render cards with type label, title, and body detail
  3. Wire overview layout for all cards from spec loader
- **Done when:** All acceptance criteria for F-001 pass on overview load from spec

### T-002: Wire intent pipeline on chat submit

- **Feature:** F-002
- **Status:** in_progress
- **Instructions for agent:**
  1. Connect chat bar to `action:intent` edge function
  2. Show preview diff on canvas and summary in side panel
  3. Implement commit and discard actions against preview row
- **Done when:** All acceptance criteria for F-002 pass end-to-end with InsForge API

### T-003: Spec export on commit

- **Feature:** F-002
- **Status:** done
- **Instructions for agent:**
  1. Assemble full nine-file spec tree from spec_sections on commit
  2. Run validate-spec before write; return exportedSpec in response
  3. Provide `npm run write:spec` helper for repo sync
- **Done when:** Commit returns valid exportedSpec; write:spec updates repo spec/
