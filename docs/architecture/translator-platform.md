# Translator Platform Architecture

Design notes for the NLIDE core: users input **intent**; the platform produces **structured, human-readable MD** that agents can execute against. A visual layer sits on top (later).

---

## Current Scope: Flow B Only

**We are building Flow B — human input → intent MD.**

| Flow | In scope? | Description |
|------|-----------|-------------|
| **A. Code → MD** | ⏸ Later (optional) | Reverse-engineer repo; bootstrap/import only, with translate layer into intent |
| **B. Human → MD** | ✅ **Now** | User natural language → structured intent spec for agents |
| **C. MD → Code** | ❌ Out of scope | Execution agents (Cursor, Replicas, etc.) |

See **[flow-b-v0.md](./flow-b-v0.md)** for the detailed v0 spec: output files, acceptance criteria, tasks, and pipeline.

Flow A details (deferred): **[flow-a-v0.md](./flow-a-v0.md)**

---

## What we are building (end result)

An IDE where the user **creates structured documentation of what they want**:

- Human-readable — natural language, cards, simple visuals (later)
- **Not** about how existing code works
- **Agent-executable** — features with acceptance criteria, tasks with instructions
- Optional translate layers later (import from repo, export to code via external agents)

Flow B is the core product. Everything else supports or extends it.

---

## What Flow B produces

MD that describes **intent**:

1. **What the user wants** — features, goals, scope
2. **Who it's for** — users, pain points, context
3. **How agents should achieve it** — tasks, acceptance criteria, constraints

Example:

> **F-001:** Users can sign in with Google. Enterprise admins can revoke access.  
> **T-001:** Implement OAuth; restrict domains; add admin revoke UI. Done when F-001 acceptance criteria pass.

Not:

> "The Sign in button on LoginForm.tsx calls the auth API."

---

## Three-Layer Model

```
┌─────────────────────────────────────┐
│  Visual Layer (later)               │  ← cards, diagrams — reads & edits intent
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│  Intent Layer (/spec/*.md)          │  ← what we build now (Flow B)
│  product · users · features · tasks │
└──────────────────┬──────────────────┘
                   │
            Flow B: AI Translator
                   │
┌──────────────────▼──────────────────┐
│  User input (natural language)      │
└─────────────────────────────────────┘

        (optional later)
        Code ──A──► code-description MD ──translate──► intent spec
```

| Layer | Role |
|-------|------|
| **User input** | What the human wants — input to Flow B |
| **Intent MD** | Structured spec — output of Flow B; source of truth |
| **Visualization** | Friendly view/edit surface — later |
| **Code** | Out of scope for NLIDE v0; Flow C via external agents |

---

## All flows (context)

| Flow | Input | Output | Nature |
|------|--------|--------|--------|
| **A. Code → MD** | Repo | Code-description MD | Understand existing implementation (deferred) |
| **B. Human → MD** | User text | Intent spec MD | **Capture & structure intent** ← **current focus** |
| **C. MD → Code** | Intent spec MD | Code | Implement (execution agents, not us) |

```
        Code ──A──► MD ──translate──► intent MD ◄──B── User input (now)
                                           │
                                           C  execution agents (out of scope)
                                           ▼
                                         Code
```

---

## The Determinism Goal

Clear intent MD makes downstream execution (Flow C) **near-deterministic**.

| Phase | AI role | Variation acceptable? |
|-------|---------|----------------------|
| **B (translator)** | Structure user intent, fill spec | Some — wording, grouping |
| **C (execution)** | Implement what spec says | **Minimal** — same spec → same outcome |

Flow B must produce:

1. **Acceptance criteria** per feature — what "done" means
2. **Agent instructions** in tasks — numbered, concrete steps
3. **Constraints** — stack, non-goals
4. **Stable IDs** — `F-001`, `T-001`
5. **Open questions** — flagged, not silently guessed
6. **Decisions recorded** — `decisions.md` for resolved choices

Human approval on the spec is the gate before agents execute.

---

## Flow B pipeline

```
User natural language
  → parse intent (LLM)
  → router (map to spec files, structured JSON)
  → writers (one call per file, patch with IDs + criteria)
  → validator (links, IDs, contradictions)
  → human review
  → /spec/*.md
```

Do not use one mega-prompt. Small typed steps.

### v0 spec files

```
spec/
  INDEX.md
  product.md
  users.md
  features.md
  architecture.md
  tasks.md
  constraints.md
  decisions.md
  open-questions.md
```

Details and examples: **[flow-b-v0.md](./flow-b-v0.md)**

---

## Intent writing rules

- **What should exist**, not how current code works
- **Acceptance criteria** on every feature
- **Agent instructions** in tasks
- **Stable IDs** across edits
- **Open questions** instead of hallucination

| Bad | Good |
|-----|------|
| "Add button to LoginForm.tsx" | "Users can sign in with Google" |
| "Handle auth somehow" | "Done when: OAuth works; only @company.com allowed" |

---

## Minimal v0 architecture

```
┌──────────────┐     ┌─────────────────┐     ┌─────────────┐
│  User input  │────►│  Translator     │────►│  /spec/*.md │
│  (text/chat) │     │  (Flow B)       │     │  intent     │
└──────────────┘     └────────┬────────┘     └──────┬──────┘
                              │                      │
                     LLM structured outputs          ▼
                     router → writers → validate   (later: card UI)
```

```bash
nlide intent add "Add Google login for enterprise users"
```

---

## Useful tools (Flow B)

| Tool | Use |
|------|-----|
| **Instructor / Pydantic AI / structured outputs** | Router and writer JSON schemas |
| **OpenAI / Anthropic API** | Intent parsing and spec writing |
| **Git** | Version control for `/spec` |
| **Simple web UI or CLI** | User input surface for v0 |

Not needed for v0: gitingest, ripgrep, Tree-sitter (those are Flow A).

---

## Build phases

### Phase 1 (now) — Flow B

- User text → intent MD (`features`, `tasks`, `constraints`, …)
- Router → writer → validator pipeline
- Acceptance criteria + agent instructions in output
- Human review gate

### Phase 2 (later) — Visual layer

- **Web intent canvas** — cards, links, central Index node, rich viz embeds
- See **`docs/product/canvas-ui-vision.md`** and **`docs/product/tech-stack.md`**
- User edits cards → same Flow B pipeline; MD underneath each card

### Phase 3 (later) — Flow A optional import

- Repo → draft spec via translate layer into **intent shape** (not button-level code docs)
- Bootstrap existing projects only

### Phase 4 (later) — Flow C

- External agents read `/spec` and implement
- Not built into NLIDE

---

## What to skip now

- Flow A (repo → MD) as primary path
- Flow C (MD → code)
- Mem0 / Zep / vector memory
- Button-level reverse engineering
- Full IDE chrome

---

## Key design decisions

1. **Start with Flow B** — intent IDE is the product; A is optional import later
2. **Intent, not code documentation** — what user wants, not how code works
3. **Single source of truth:** `/spec` MD files
4. **Stable IDs** — `F-001`, `T-001`, `D-001`
5. **Acceptance criteria + agent tasks** — executable spec
6. **INDEX.md** — central entry point for every agent read
7. **Human approval** — before spec is treated as committed

---

## Bottom line

**Now:** Build Flow B — user describes what they want → structured intent MD with acceptance criteria and agent-ready tasks.

**Later:** Visual layer, optional Flow A import, Flow C via external agents.

The NLIDE artifact is **intent**, not code. Flow B creates and maintains it.
