# Execution Phase Planning

**v2 shipped** in Build plan tab — human-gate phases with dual checklists (agent + user). Fresh LLM regenerate from full spec, preview → commit. Canvas Phase cards and `phases.md` export remain future.

Related: [Flow B v0](../architecture/flow-b-v0.md) · [Canvas UI](./canvas-ui-vision.md) · [Tech stack](./tech-stack.md)

---

## Purpose

After intent is captured in `/spec`, an **execution planner** (AI orchestration):

1. Reads the full intent graph (features, tasks, constraints, architecture, open questions)
2. **Decides how many phases** the overall execution should have
3. **Breaks work into ordered phases** — each phase ends at a **human gate** (API keys, decisions, approvals)
4. Surfaces phases in the **Build plan** tab with agent work + user tasks per phase

This sits **between Flow B (intent MD)** and **Flow C (external agent execution)**.

```
Intent spec (Flow B)
        ↓
Execution phase planner  ← v2 (Build plan Regenerate)
        ↓
Phase 1 (agent + user) → Phase 2 → Phase 3 …
        ↓
External agents execute per phase (Flow C)
```

---

## What the planner produces (v2)

| Output | Description |
|--------|-------------|
| **Phase count** | AI-determined N — minimized; vertical slices that stop at real human blockers |
| **humanGateReason** | Plain-language why the phase ends here (user must act before next phase) |
| **agentChecklist** | 2–6 concrete agent deliverables for this slice (implement X, wire Y, export Z) |
| **userChecklist** | 1–4 user actions before the next phase (API key, decision, approval, config) |
| **relatedTaskIds** | Optional T-xxx traceability for export — not UI checkboxes, not validated for coverage |
| **Exit criteria** | Optional “done when” bullets for agent work |

**Phase complete:** Both agent checklist **and** user checklist must be checked off before the next phase unlocks.

**Removed in v2:** Per-T-xxx checkbox UI, requirement that every T-xxx appear in exactly one phase.

### Example

**Input:** Feature F-001 (Google login) + F-002 (admin revoke) + constraints + open questions

**Planner output:**

| Phase | Goal | Human gate | Agent items | User items |
|-------|------|------------|-------------|------------|
| **Phase 1 — OAuth foundation** | Provider + callback wired | User adds OAuth credentials | Wire callback, domain middleware | Add `GOOGLE_CLIENT_ID`, pick allowlist |
| **Phase 2 — User login UI** | Login button + session | User approves UX | Build login page, session store | Review login flow |
| **Phase 3 — Admin revoke** | Revoke API + UI | User approves admin deploy | Revoke endpoint + admin table | Confirm production deploy |

---

## Planner behavior (v2 shipped)

```
action:plan-execution
  → load agentSpec (merged full MD: repo/Postgres base + canvas overrides) + humanSynthesis
  → LLM only (requires OPENROUTER_API_KEY): human-gate phase count + dual checklists
  → validate: structural only (phase order, duplicate IDs, empty plan)
  → relatedTaskIds not in tasks.md → warnings only
  → save execution_plan_previews → UI preview banner
action:commit-execution-plan → execution_plans (full replace)
action:discard-execution-plan → delete preview
```

**Not yet:** `phases.md` in spec export, canvas Phase cards.

### Rules the planner follows

- **Constraints first** — stack and non-goals bound phase design
- **Human gates at real blockers** — secrets, decisions, approvals, open questions
- **Vertical slices when possible** — shippable increments over pure layer cake
- **Minimize phase count** — don’t over-split trivial work
- **Surface open questions** as user checklist items — don’t resolve them in the plan
- **Optional relatedTaskIds** when an agent item clearly maps to an existing T-xxx

### Legacy v1 plans

Committed v1 plans (task-ID grouping) remain in Postgres but are **hidden** in the UI until the user clicks **Regenerate**, which produces v2 and replaces stored JSON.

---

## Spec schema addition (future)

```
spec/
  phases.md          ← PHASE-001, PHASE-002, …
  tasks.md           ← each task may reference phase_id
  execution-plan.md  ← summary: N phases, rationale, risks
```

### `phases.md` entry (example)

```markdown
### PHASE-001: Foundation

- **Status:** pending
- **Goal:** OAuth provider and domain restriction in place
- **Human gate:** User adds OAuth client credentials
- **Agent checklist:** Wire callback, enforce allowlist
- **User checklist:** Add GOOGLE_CLIENT_ID, confirm domain list
- **Related tasks:** T-001, T-002
- **Exit criteria:**
  - Google OAuth configured
  - Domain allowlist enforced in auth middleware
- **Blocks:** PHASE-002
```

---

## Canvas representation (future)

- **Phase card** — large grouping node on canvas
- **Contains / links to** — task cards for that phase
- **Sequence edges** — Phase 1 → Phase 2 → Phase 3
- **Viz options** — Mermaid timeline, TanStack Table phase overview, force graph with phase clusters

---

## Relationship to Flow C

- Flow C agents receive: current **phase brief** (`phases/PHASE-xxx.md`) with agent checklist + human gate block
- User checklist items are mandatory stops between phases
- Optional `relatedTaskIds` link to `spec/tasks.md` sections for acceptance criteria
- Planner re-runs when intent spec changes materially (Regenerate in Build plan)

---

## v0 vs v2

| v0 (hackathon) | v2 (current) |
|----------------|--------------|
| User input → intent cards + MD | After intent stable |
| Tasks listed flat in `tasks.md` | Phases with agent + user checklists |
| Manual task order | AI proposes phase count + human gates |
| No execution | External agent runs phase-by-phase (Flow C handoff export) |

Flow B loop works; phase planner v2 lives in Build plan. Next: `phases.md` + canvas Phase cards.
