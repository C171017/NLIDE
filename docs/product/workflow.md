# NLIDE Workflow — Batch Intent, Not Live Execution

How the product actually works. **`[USER]`** — locked product decision.

**Agents:** if workflow changes, update this file + [user-decisions.md](../meta/user-decisions.md).

Related: [Canvas UI](./canvas-ui-vision.md) · [Flow B](../architecture/flow-b-v0.md) · [Tech stack](./tech-stack.md)

---

## Core principle

**Define first. Execute later.**

NLIDE is not a live coding agent. It is an **intent canvas** where you build a complete, clear picture — then hand the full spec to an external agent (Flow C) in one shot.

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE: Intent design (what we build now)                    │
│  Chat → translate → preview → commit → edit cards → repeat  │
│  NO code execution. NO agent running continuously.           │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    export /spec/*.md (on commit)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE: Execution (later, external)                          │
│  Agent reads entire spec with full context → implements once │
└─────────────────────────────────────────────────────────────┘
```

---

## What we are NOT building

| Anti-pattern | Why not |
|--------------|---------|
| Agent executes code in real time as you type | Fragmented context; user loses control |
| Streaming agent edits on every keystroke | Expensive; canvas becomes noisy |
| Copilot-style inline code suggestions | That's Cursor, not NLIDE |
| Partial spec handoff mid-session | Agent lacks full picture → non-deterministic results |

---

## What we ARE building (v0)

Focus: **canvas design, structure, knowledge, choices, visualization.**

1. **Chat box** — user describes requests in natural language
2. **Translator (batch)** — AI runs once per chat submit; reads **whole current canvas + spec** as context
3. **Preview** — proposed cards, links, MD changes shown **before** anything is saved
4. **Commit or discard** — user decides
5. **Manual card editing** — user edits any card individually anytime (TipTap); direct sync to underlying MD
6. **Repeat** — more chat, more edits, until the picture is clear
7. **Export** — on commit, hybrid storage: Postgres + export `/spec/*.md` for agents

Execution agents run **only after** the user is satisfied with the canvas — not during design.

---

## The design loop (primary UX)

```
                    ┌──────────────────┐
                    │  User edits cards │◄────────────────┐
                    │  (individual,     │                 │
                    │   anytime)        │                 │
                    └────────┬─────────┘                 │
                             │                           │
┌──────────────┐    ┌────────▼─────────┐    ┌───────────▼──────────┐
│  Chat input  │───►│  Translator runs │───►│  Preview on canvas   │
│  (batch)     │    │  (wait for result)│    │  (ghost / diff state) │
└──────────────┘    └──────────────────┘    └───────────┬──────────┘
                                                        │
                              ┌──────────────────────────┼──────────────────────────┐
                              ▼                          ▼                          │
                         [ Commit ]                 [ Discard ]                       │
                              │                          │                          │
                              ▼                          └──► back to editing ────────┘
                    Apply to canvas + Postgres
                    Export /spec/*.md
                              │
                              ▼
                    Continue editing or
                    hand off to external agent (later)
```

### Step-by-step

| Step | Actor | What happens |
|------|-------|--------------|
| 1 | User | Types request in **chat box** |
| 2 | System | Sends **full canvas state + spec** to translator (one LLM batch) |
| 3 | System | Returns **preview** — proposed cards, edges, MD patches |
| 4 | User | Reviews preview on canvas (ghost overlay or diff panel) |
| 5 | User | **Commit** → writes to Postgres + exports MD — or **Discard** |
| 6 | User | **Edits individual cards** directly (title, body, links) — no AI required |
| 7 | User | Repeats from step 1 when ready for next batch of AI help |

---

## Two edit modes (both important)

### Mode A — Chat → Translator (batch AI)

- User asks for structural changes: new features, tasks, architecture links
- AI proposes multi-card updates
- Always goes through **preview → commit**

### Mode B — Direct card edit (manual, no AI)

- User clicks a card and edits inline (TipTap)
- **Individual card** changes sync to underlying MD immediately (or on blur)
- Preserves stable IDs (`F-001`, etc.)
- Does **not** trigger translator or execution agent
- Critical for refining wording, acceptance criteria tone, layout

Both modes keep human in control. AI assists in batches; human refines continuously.

---

## Preview → Commit (locked decision #1)

**Preview before commit** — never auto-apply translator output.

Preview UI should show:

- New / updated / removed cards on canvas (visual diff)
- Proposed edges
- MD diff in side panel (optional)
- Summary: "Will create F-002, T-003, link to Index"

Actions:

- **Commit** — apply preview to Postgres; export `/spec/*.md`
- **Discard** — revert preview; canvas unchanged

Draft state lives in memory or a `preview_*` staging table — not committed spec until user approves.

---

## Spec storage (locked decision #2)

**Hybrid (C):**

| Layer | Role |
|-------|------|
| **Postgres (InsForge)** | Runtime source while designing — cards, spec sections, canvas layout |
| **`/spec/*.md` export** | On **commit** — agent-readable files, git-trackable |

External agents (Flow C) read exported MD with **full context**, not partial streaming updates.

---

## When execution happens (Flow C — later)

Only when:

1. Canvas reflects what user wants
2. User explicitly exports or triggers "Ready for agent"
3. External agent (Cursor, Replicas) receives **complete** `/spec`

Agent runs with whole spec as reference — deterministic, not chat-by-chat.

Future **execution phase planner** may split that handoff into phases — still batch per phase, not real-time. See [execution-phases.md](./execution-phases.md).

---

## v0 scope reminder

Build the **intent design loop** only:

- Canvas structure + cards + links + viz
- Chat → preview → commit
- Individual card editing
- Hybrid spec storage

Do **not** build in-app code execution or live agent loops in v0.

---

## Success criteria

- [ ] Chat submit runs translator once and shows preview (not live stream)
- [ ] User can commit or discard preview
- [ ] User can edit any card individually without triggering AI
- [ ] Committed state exports to `/spec/*.md`
- [ ] No code execution or Flow C inside NLIDE v0
- [ ] User can run multiple design cycles before any external agent
