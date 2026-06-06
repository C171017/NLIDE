# Execution Phase Planning (Future)

Planned capability — **not v0**. Documented here so the canvas and spec schema can evolve toward it.

Related: [Flow B v0](../architecture/flow-b-v0.md) · [Canvas UI](./canvas-ui-vision.md) · [Tech stack](./tech-stack.md)

---

## Purpose

After intent is captured in `/spec`, an **execution planner** (AI orchestration) will:

1. Read the full intent graph (features, tasks, constraints, architecture)
2. **Decide how many phases** the overall execution should have
3. **Break work into ordered phases** — each phase a coherent chunk an agent (or human) can complete before moving on
4. Surface phases on the canvas as **Phase cards** linked to task cards

This sits **between Flow B (intent MD)** and **Flow C (external agent execution)**.

```
Intent spec (Flow B)
        ↓
Execution phase planner  ← future
        ↓
Phase 1 → Phase 2 → Phase 3 …
        ↓
External agents execute per phase (Flow C)
```

---

## What the planner produces

| Output | Description |
|--------|-------------|
| **Phase count** | AI-determined N (not fixed upfront) — e.g. 3 phases for a small feature, 7 for a large product |
| **Phase cards** | Human-readable: name, goal, what’s included |
| **Phase MD** | Agent-executable: `phases.md` or sections in `tasks.md` |
| **Task assignment** | Each `T-xxx` mapped to exactly one phase |
| **Dependencies** | Phase N blocks on Phase N−1; tasks within phase ordered |
| **Exit criteria** | Per phase: “done when these acceptance criteria pass” |

### Example

**Input:** Feature F-001 (Google login) + F-002 (admin revoke) + constraints

**Planner output:**

| Phase | Goal | Tasks |
|-------|------|-------|
| **Phase 1 — Foundation** | OAuth infra + domain config | T-001, T-002 |
| **Phase 2 — User flow** | Login UI + session | T-003, T-004 |
| **Phase 3 — Admin** | Revoke access UI + API | T-005 |

Each phase becomes a **canvas card** linked to its task cards and to the previous/next phase.

---

## Planner behavior (conceptual)

```
POST /api/plan-execution
  → load spec (features, tasks, constraints, architecture)
  → LLM: estimate complexity, identify dependency layers
  → LLM: propose phase count + grouping + ordering
  → validate: every task assigned, no cycles, constraints respected
  → human review / approve phase plan
  → write phases.md + update canvas (Phase cards + edges)
```

### Rules the planner should follow

- **Constraints first** — stack and non-goals bound phase design
- **Vertical slices when possible** — prefer shippable increments over pure layer cake
- **Minimize phase count** — don’t over-split; merge trivial tasks
- **Explicit dependencies** — auth before admin revoke, etc.
- **Human gate** — user approves phase plan before any Flow C execution

---

## Spec schema addition (future)

```
spec/
  phases.md          ← PHASE-001, PHASE-002, …
  tasks.md           ← each task gains phase_id
  execution-plan.md  ← summary: N phases, rationale, risks
```

### `phases.md` entry (example)

```markdown
### PHASE-001: Foundation

- **Status:** pending
- **Goal:** OAuth provider and domain restriction in place
- **Tasks:** T-001, T-002
- **Exit criteria:**
  - Google OAuth configured
  - Domain allowlist enforced in auth middleware
- **Blocks:** PHASE-002
```

---

## Canvas representation

- **Phase card** — large grouping node on canvas
- **Contains / links to** — task cards for that phase
- **Sequence edges** — Phase 1 → Phase 2 → Phase 3
- **Viz options** — Mermaid timeline, TanStack Table phase overview, force graph with phase clusters

---

## Relationship to Flow C

- Flow C agents receive: current **phase** + **tasks in that phase only**
- Reduces context size and ambiguity
- Same spec → same phase plan → **more deterministic execution**
- Planner re-runs when intent spec changes materially

---

## v0 vs future

| v0 (hackathon) | This feature |
|----------------|--------------|
| User input → intent cards + MD | After intent stable |
| Tasks listed flat in `tasks.md` | Tasks grouped into phases |
| Manual task order | AI proposes phase count + breakdown |
| No execution | External agent runs phase-by-phase |

Build intent capture first; add phase planner once Flow B loop works.
