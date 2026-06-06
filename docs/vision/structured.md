# Natural Language IDE — Structured Breakdown

A structured view of the vision, organized for planning, design, and implementation.

---

## 1. Product Definition

| Item | Description |
|------|-------------|
| **Name** | Natural Language IDE (NLIDE) |
| **Tagline** | Cursor is an IDE for code. Natural Language IDE is an IDE for intent. |
| **Primary artifact** | Intent (not code) |
| **Core shift** | Humans work in understandable concepts; agents work in structured specifications |

---

## 2. Core Principle

### Traditional IDE flow

```
Human → Code → Compiler
```

### Natural Language IDE flow

```
Human → Intent → Agent → Code
```

### Implication

- Code is generated and maintained downstream of intent
- The IDE optimizes for intent clarity, not syntax editing
- Agents are first-class participants in the development loop

---

## 3. Architecture: Two Layers (v1)

### Layer 1 — Human Layer (Upper)

**Purpose:** Simple, understandable project representation for humans.

**Characteristics:**

- Natural language
- Visual
- Easy to edit
- Easy to review
- Easy to approve

**Design bar:** UI/UX must exceed traditional IDEs — natural language development is new; classic IDEs were built for high-level programming languages, not intent.

**Example sections:**

| Section | Questions / Content |
|---------|---------------------|
| Product Vision | What are we building? Why? |
| Users | Who is the target user? What are their pain points? |
| Features | Feature list, priority, status |
| Architecture Overview | Visual diagrams, system relationships |
| Open Questions | Unresolved decisions, risks, assumptions |
| Agent Activity Feed | Current agent work, recent decisions, suggested actions |

---

### Layer 2 — Agent Layer (Lower)

**Purpose:** Structured, machine-readable knowledge agents can execute against.

**Characteristics:**

- Markdown-based
- Version-controlled
- Structured
- Machine-readable

**Example spec files:**

| File | Likely contents |
|------|-----------------|
| `/spec/product.md` | Product definition, goals, scope |
| `/spec/users.md` | Personas, pain points, use cases |
| `/spec/features.md` | Feature specs, priority, status |
| `/spec/architecture.md` | System design, components, relationships |
| `/spec/tasks.md` | Actionable work items for agents |
| `/spec/constraints.md` | Technical and product constraints |
| `/spec/roadmap.md` | Timeline, milestones, sequencing |
| `/spec/decisions.md` | Architecture and product decisions (ADR-style) |

---

## 4. Synchronization Engine

Bidirectional sync keeps the human view and agent spec layer aligned.

### Human → Agent

| Trigger | Example | System updates |
|---------|---------|----------------|
| User edits intent in human layer | "Support Google login" | `features.md`, `architecture.md`, `tasks.md` |

### Agent → Human

| Trigger | Example | System action |
|---------|---------|---------------|
| Agent discovers new requirement | "OAuth service required" | Create new Architecture Card in human layer |
| User response | Approve or reject | Propagate decision back to spec layer |

### Key rule

- Users **never edit prompt files directly**
- Users edit **intent**
- The system **generates and maintains** structured agent context automatically

---

## 5. Key Components (System Map)

```
┌─────────────────────────────────────────────────────────┐
│                    HUMAN LAYER (UI)                      │
│  Vision · Users · Features · Architecture · Questions   │
│  Agent Activity Feed                                     │
└──────────────────────────┬──────────────────────────────┘
                           │
                  Synchronization Engine
                           │
┌──────────────────────────▼──────────────────────────────┐
│                   AGENT LAYER (/spec)                    │
│  product · users · features · architecture · tasks · …   │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
                      Agent execution
                           │
                           ▼
                         Code
```

### Component list

- **Human Layer UI** — Visual, editable intent surface
- **Agent Layer (`/spec`)** — Version-controlled markdown specs
- **Synchronization Engine** — Human ↔ Agent translation and propagation
- **Approval workflow** — Human review of agent-proposed changes
- **Agent Activity Feed** — Transparency into agent decisions and work

---

## 6. Long-Term Vision: Intent Operating System

NLIDE replaces fragmented tooling with a single source of truth.

### Becomes source of truth for

- Product intent
- Agent memory
- Implementation planning

### Replaces (conceptually)

- Notion (docs)
- Whimsical (diagrams)
- Linear (tasks)
- Prompt files (agent context)
- Ad-hoc agent memory

### End state

One **Intent Operating System** — intent in, synchronized specs out, agents execute, humans stay in control.

---

## 7. Design Principles (Derived)

1. **Intent first** — The human-facing artifact is always intent, not code or prompts
2. **Two views, one truth** — Human layer and agent layer stay synchronized
3. **No prompt editing** — Users never maintain raw agent context manually
4. **Agent transparency** — Activity feed and approval flows keep humans in the loop
5. **Superior UX** — NLIDE must be more intuitive than traditional IDEs because the paradigm is new
6. **Structured for agents** — Lower layer is markdown, versioned, and machine-readable
7. **Progressive disclosure** — Humans see simplicity; agents see structure

---

## 8. Suggested Repository Layout (Documentation)

**Current build focus:** Flow B web app — intent canvas + orchestration. See `docs/architecture/flow-b-v0.md` and `docs/product/`.

```
docs/
  vision/
    original.md              ← Author's original words (source narrative)
    structured.md            ← This file (planning & design breakdown)
  architecture/
    translator-platform.md   ← Platform overview (start with Flow B)
    flow-b-v0.md             ← Current v0 spec (human → intent MD)
    flow-a-v0.md             ← Deferred (repo import / bootstrap)
  product/
    canvas-ui-vision.md      ← Web canvas, cards, viz catalog
    workflow.md              ← Batch design loop, preview → commit, manual edit
    tech-stack.md            ← All locked stack + hosting decisions
    execution-phases.md      ← Future: AI phase count + execution breakdown

spec/                        ← Intent layer (generated by orchestrator)
  INDEX.md
  product.md
  …

canvas.json                  ← Card positions, links, viz metadata (planned)
```

---

## 9. Open Questions (For Future Decisions)

- How is conflict resolution handled when human edits and agent updates diverge?
- What is the approval UX for agent-proposed Architecture Cards?
- How granular should sync be (sentence-level, section-level, file-level)?
- What versioning / diff model does the human layer use?
- How are diagrams in Architecture Overview generated and kept in sync with `/spec/architecture.md`?
