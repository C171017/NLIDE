# Canvas UI Vision — Web App v0

The NLIDE web app is an **intent canvas**: a visual, interactive surface where humans read and edit what they want, while **agent-executable markdown** lives underneath each card. Flow B orchestration decides how user input maps onto the graph.

**`[USER]`** canvas concept · **`[AI-INFERRED]`** v0 viz subset and component choices

**Agents:** UI/design changes → update this file + [user-decisions.md](../meta/user-decisions.md) or [ai-inferred-decisions.md](../meta/ai-inferred-decisions.md).

**Platform:** Web app first (hackathon). Tauri/macOS native later — same React frontend.

Related: [Flow B v0](../architecture/flow-b-v0.md) · [Tech stack](./tech-stack.md) · [Current state](../implementation/current-state.md)

---

## Core concept

```
┌─────────────────────────────────────────────────────────────┐
│                     INTENT CANVAS (web)                      │
│                                                              │
│     ┌──────────┐         ┌──────────┐                       │
│     │  Users   │────────►│ Features │                       │
│     └──────────┘         └────┬─────┘                       │
│                               │                              │
│                    ┌──────────▼──────────┐                  │
│                    │   INDEX (center)    │  ← central node  │
│                    │   Project intent    │                  │
│                    └──────────┬──────────┘                  │
│              ┌────────────────┼────────────────┐            │
│              ▼                ▼                ▼            │
│        ┌──────────┐   ┌──────────┐   ┌──────────┐          │
│        │ Product  │   │  Tasks   │   │  Arch    │  …       │
│        └──────────┘   └──────────┘   └──────────┘          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Input bar / chat  →  AI orchestration  →  cards   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
         │ each card
         ▼
   agent-friendly .md file (hidden layer, synced)
```

| Surface | Audience | Content |
|---------|----------|---------|
| **Card (visible)** | Human | Short natural language, status, optional rich viz |
| **MD file (underneath)** | Agent | Structured spec: IDs, acceptance criteria, links |
| **Canvas links** | Both | Relationships between intent nodes |

Humans never edit raw agent files directly in v0 — they edit **cards** (individual inline edit anytime) or propose changes via **chat → preview → commit**.

**Not live execution:** NLIDE defines intent on the canvas first; external agents run later with full exported spec. See **[workflow.md](./workflow.md)**.

---

## Canvas

The whole web experience is one **canvas** — an infinite or large pannable/zoomable workspace.

### Properties

- **Central node** — `INDEX` / project hub; every graph read starts here (mirrors `spec/INDEX.md`)
- **Linked cards** — edges show relationships (depends on, relates to, blocks, implements)
- **Spatial layout** — position is meaningful but secondary to links; auto-layout + manual drag
- **Zoom levels** — overview (whole project) → focus (single card expanded)
- **High interactivity** — drag, connect, expand, inline edit, rich embeds per card type

### Card types (map to spec files)

| Card | Spec file | Human sees | Agent MD contains |
|------|-----------|------------|-------------------|
| **Index** | `INDEX.md` | Project name, one-line summary | Routing rules, file map |
| **Product** | `product.md` | What & why | Goals, scope, non-goals |
| **Users** | `users.md` | Who it's for | Personas, pain points |
| **Feature** | `features.md` (one card per F-xxx) | Feature title + plain description | Acceptance criteria, priority, status |
| **Task** | `tasks.md` (one card per T-xxx) | What needs to happen | Numbered agent instructions |
| **Architecture** | `architecture.md` | System diagram / overview | Components, relationships |
| **Constraint** | `constraints.md` | Rules & limits | Stack, patterns, non-goals |
| **Decision** | `decisions.md` | Choice + rationale | ADR-style record |
| **Open question** | `open-questions.md` | Unresolved item | Context, options |

One spec file can spawn **many cards** (e.g. one Feature card per `F-001`, `F-002`).

---

## Cards — human layer

Each card is:

1. **Human-readable** — short title, plain-language body, status chip
2. **Easy to edit** — click to edit inline or side panel; no markdown syntax required on surface
3. **Linked** — connected to related cards on canvas
4. **Visualizable** — optional rich embed chosen per card (see [Visualization catalog](#visualization-catalog))
5. **Backed by MD** — every card syncs to an agent-executable markdown file or section

### Edit flow — two modes

**Mode A — Manual (anytime, no AI):** User clicks a card → TipTap inline edit → syncs underlying MD in Postgres; preserves IDs.

**Mode B — Chat batch:** User sends chat → translator runs once with full context → **preview** on canvas → user **commit or discard**.

See **[workflow.md](./workflow.md)** for the full design loop.

```
Manual:  User edits card → sync MD (no AI, no execution agent)

Chat:    User types in chat
           → translator (batch, full canvas + spec context)
           → PREVIEW on canvas (not committed)
           → user Commit or Discard
           → on Commit: Postgres + export /spec/*.md
```

### New content from user input (chat)

```
User types in chat box
  → orchestration runs once (router + writers) — wait for result
  → preview: proposed cards, links, MD patches
  → user Commit or Discard
  → on Commit: canvas updated + MD exported
```

Do **not** stream agent output onto canvas in real time. Batch only.

---

## AI orchestration layer

Sits between **user input** and **canvas + MD**. Same pipeline as Flow B:

```
User input
  → Parse intent (what is the user asking?)
  → Router (which cards/files? add / update / link?)
  → Writers (patch MD per target)
  → Canvas updater (create/move/connect cards)
  → Validator (IDs, links, contradictions)
  → Return PREVIEW only (not committed)
  → Human Commit or Discard
  → On Commit: apply + export /spec/*.md
```

**Not live execution.** Orchestrator translates intent to canvas structure — it does not run code or execute Flow C. User builds a clear picture first; external agents receive full spec later.

### Orchestrator responsibilities

| Job | Example |
|-----|---------|
| **Classify** | New feature vs edit vs question vs constraint |
| **Route** | "Google login" → Feature card + Task card + Architecture link |
| **Place** | Suggest canvas position near related nodes |
| **Link** | Connect Feature F-001 → Tasks T-001, T-002 |
| **Disambiguate** | Move unresolved parts to Open Question card |
| **Preserve IDs** | Update wording without breaking `F-001` references |

Orchestration is **not** the visual canvas — it is the backend brain (LLM + structured JSON + validator).

---

## Two layers per card

```
┌─────────────────────────────┐
│  CARD (human)               │
│  Title: Google login        │
│  Body: Users sign in with   │
│        their Google account │
│  [diagram / chart / table]  │  ← optional viz embed
└──────────────┬──────────────┘
               │ sync
┌──────────────▼──────────────┐
│  MD (agent)                 │
│  ### F-001: Google login    │
│  - status: proposed         │
│  - acceptance_criteria: …   │
│  - related: [T-001, …]      │
└─────────────────────────────┘
```

Agents read the **MD layer** (or exported `/spec`). Humans work on the **card layer**. The canvas shows relationships both layers share.

---

## Visualization catalog

Cards can embed rich interactive content. Not all 21 are required for v0 — pick a subset per card type.

### Instant text forms

| # | Type | Typical use on canvas | Example card |
|---|------|----------------------|--------------|
| 1 | **ASCII / terminal** | CLI output, logs, mock terminal | Task: "run this command" |
| 2 | **Markdown table** | Feature matrix, comparison | Constraints, requirements |
| 3 | **JSON / structured data** | API contract, config preview | Architecture, backend |
| 4 | **LaTeX / math** | Formulas, algorithms | Architecture, decisions |
| 5 | **Code + syntax highlight** | Snippet reference (not primary intent) | Task instructions only |

### Rendered diagrams & charts

| # | Type | Typical use | Example card |
|---|------|-------------|--------------|
| 6 | **SVG diagram** | Custom icons, simple flows | Architecture |
| 7 | **Mermaid diagram** | System flow, sequence, ER | Architecture, Feature flow |
| 8 | **Chart.js data chart** | Metrics, priority breakdown | Roadmap, status |
| 9 | **HTML / CSS widget** | Custom mini UI mock | Feature preview |

### Interactive & computational

| # | Type | Typical use | Example card |
|---|------|-------------|--------------|
| 10 | **Interactive 3D (Three.js)** | Spatial concepts, 3D mock | Architecture (optional) |
| 11 | **Generative particles (Canvas)** | Ambient / hero canvas bg | Index hub (decorative) |
| 12 | **Playable game (Canvas)** | Gamified demo | Hackathon wow-factor only |
| 13 | **Force-directed graph (D3)** | **Project link map, dependency graph** | **Index, Architecture — core** |
| 14 | **Physics sandbox (Matter.js)** | Playful interaction | Low priority |
| 15 | **Cellular automaton (Game of Life)** | Demo / easter egg | Low priority |
| 16 | **Algorithm visualizer (Bubble sort)** | Edu content | Low priority |
| 17 | **Sound synthesis (Tone.js piano)** | Audio feature spec | Niche |
| 18 | **Fractal explorer (Julia set)** | Demo | Low priority |
| 19 | **3D data plot (Plotly)** | Multi-axis metrics | Analytics features |
| 20 | **Live data table (sortable/filterable)** | **Feature list, task list** | **Features, Tasks — core** |
| 21 | **Drawing canvas (paint)** | Freeform sketch on card | Open questions, whiteboard |

### Recommended v0 subset (hackathon)

Implement these first; add others incrementally via a `viz_type` field on cards:

| Priority | Viz # | Why |
|----------|-------|-----|
| **P0** | 7 Mermaid | Architecture + flows from MD |
| **P0** | 13 Force-directed graph | Canvas link map mirrors spec graph |
| **P0** | 2 Markdown table | Features, constraints at a glance |
| **P0** | 20 Live data table | Sortable feature/task lists |
| **P1** | 3 JSON | API / structured previews |
| **P1** | 5 Code highlight | Task agent instructions preview |
| **P1** | 9 HTML widget | Simple UI mock on feature cards |
| **P2** | Rest | Polish / delight after core loop works |

---

## User flows (v0)

### 1. Chat → preview → commit

User describes intent in chat → translator returns preview → user commits or discards → repeat until canvas is clear.

### 2. Edit individual card (manual)

User clicks any card → inline edit → MD syncs under that card. No AI run. Critical for refining intent between chat batches.

### 3. Design cycles

Define a lot → run translator once → edit canvas manually → run translator again when ready. **Not** continuous agent execution.

### 4. Hand off (later, external)

When satisfied, exported `/spec` goes to external agent (Cursor, etc.) with **full context** — Flow C, outside NLIDE.

---

## Layout regions (web app chrome)

```
┌────────────────────────────────────────────────────────────┐
│  Header: project name · export spec · settings             │
├──────────────────────────────────────┬─────────────────────┤
│                                      │                     │
│           CANVAS (main)              │  Side panel         │
│           cards + links + viz        │  (optional)         │
│                                      │  · card editor      │
│                                      │  · MD preview       │
│                                      │  · agent log        │
├──────────────────────────────────────┴─────────────────────┤
│  Chat: "Describe what you want…"  [Send]  → Preview mode │
│  [ Commit ]  [ Discard ]  (visible when preview active)   │
└────────────────────────────────────────────────────────────┘
```

Canvas occupies **most of the screen**. Input bar is always accessible for orchestration.

---

## Data model (conceptual)

```typescript
// conceptual — see tech-stack.md for implementation choices

Card {
  id: string              // matches F-001, or "product", or canvas uuid
  specRef: { file, anchor }  // e.g. features.md#F-001
  type: CardType
  title: string
  body: string            // human-readable
  position: { x, y }
  vizType?: VizType       // mermaid | table | force-graph | …
  vizPayload?: unknown    // type-specific data
  status?: proposed | approved | in_progress | done
}

Edge {
  id: string
  source: cardId
  target: cardId
  label?: string          // "implements", "depends on", …
}

Canvas {
  cards: Card[]
  edges: Edge[]
  centerCardId: string    // Index node
}
```

MD files remain **source of truth for agents**; canvas state is **source of truth for layout + human edits**, synced bidirectionally.

---

## Out of scope (web v0)

- macOS Tauri shell (later)
- Flow A repo import
- **In-app code execution or live agent loops (Flow C)**
- Real-time streaming translator output onto canvas
- Real-time multi-user collaboration
- All 21 viz types on day one
- Direct MD editing in main UI (preview in side panel is OK)

---

## Success criteria

- [ ] Chat submit runs translator **once** and shows **preview** (not live stream)
- [ ] User can **commit or discard** preview
- [ ] User can **edit any card individually** without triggering AI
- [ ] Committed state exports to `/spec/*.md` (hybrid storage)
- [ ] Central Index node anchors the graph
- [ ] P0 viz on relevant cards
- [ ] **No** in-app execution agent in v0

---

## Future: execution phase planning

After intent is stable, AI will **decide phase count** and **break execution into ordered phases** (Phase cards on canvas, tasks assigned per phase). Not v0.

See **[execution-phases.md](./execution-phases.md)**.

---

## Platform notes

- **Solo project** — see [tech-stack.md](./tech-stack.md)
- **Workflow:** [workflow.md](./workflow.md) — batch design, preview → commit, manual card edit
- **Hackathon:** InsForge backend; Sites for frontend; Cloudflare + Neon fallback
