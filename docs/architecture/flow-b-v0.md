# Flow B v0 — Human Input → Intent MD

**Current focus:** users input what they want; the platform structures it into human-readable, agent-executable markdown — **intent**, not code documentation.

Flows A (repo → MD) and C (MD → code) are deferred.

---

## Goal

Given natural language from the user, produce `/spec` MD that answers:

1. **What does the user want to build or change?** — features, goals, scope
2. **Who is it for and why?** — users, pain points, product context
3. **What must agents do to achieve it?** — tasks, acceptance criteria, constraints

The output is **what should exist**, not how existing code works.

---

## Intent vs code documentation

| Intent MD (Flow B — what we build) | Code MD (Flow A — later, optional) |
|-----------------------------------|-------------------------------------|
| "Users can sign in with Google" | "Sign in button calls auth API on line 42" |
| "Enterprise admins manage team access" | "AdminPanel.tsx renders a permissions table" |
| Acceptance criteria, priorities | Source file references, inferred behavior |

Agents execute from **intent**. Code descriptions are bootstrap/import only (Flow A, later).

---

## Example: User input → spec

**User input:**

> Add Google login for enterprise users. Admins should be able to revoke access.

**Router output:**

```json
{
  "targets": ["features.md", "users.md", "architecture.md", "tasks.md", "constraints.md"],
  "updates": [
    { "file": "features.md", "action": "add", "entity_id": "F-001" },
    { "file": "tasks.md", "action": "add", "entity_id": "T-001" }
  ]
}
```

**In `features.md`:**

```markdown
### F-001: Google login for enterprise users

- **Status:** proposed
- **Priority:** high
- **Description:** Users sign in with their Google workspace account.
- **Acceptance criteria:**
  - User can click "Sign in with Google" and authenticate via OAuth
  - Only accounts from allowed enterprise domains can access the app
  - Admin can revoke a user's access from the admin panel
- **Related:** users.md (enterprise admin), architecture.md (auth)
```

**In `tasks.md`:**

```markdown
### T-001: Implement Google OAuth login

- **Feature:** F-001
- **Instructions for agent:**
  1. Add OAuth provider configuration for Google
  2. Restrict sign-in to configured enterprise domains
  3. Add admin UI to revoke user access
- **Done when:** All acceptance criteria for F-001 pass
```

---

## Output schema (v0)

```
spec/
  INDEX.md           ← entry point: project summary, links to all files, agent routing rules
  product.md         ← what we're building and why
  users.md           ← target users, personas, pain points
  features.md        ← feature list with acceptance criteria (F-001, …)
  architecture.md    ← high-level system design (no file paths)
  tasks.md           ← agent-executable work items (T-001, …)
  constraints.md     ← stack, patterns, non-goals, limits
  decisions.md       ← resolved choices (D-001, …)
  open-questions.md  ← unresolved decisions needing user input
```

No `ui.md` with button-level code mapping in v0 — that belongs to Flow A. B stays at **intent and executable instruction** level.

### `INDEX.md`

- Project name and one-paragraph summary
- Table of spec files with scope descriptions
- Agent rules: "Start here. Read constraints before architecture. Tasks reference feature IDs."

### `features.md`

Each feature:

- Stable ID (`F-001`)
- Status: `proposed` | `approved` | `in_progress` | `done`
- Priority
- Description (human-readable)
- **Acceptance criteria** (agent-testable)
- Links to related files

### `tasks.md`

Each task:

- Stable ID (`T-001`)
- Links to feature ID
- **Instructions for agent** — numbered, concrete steps
- **Done when** — references acceptance criteria

This is what makes execution near-deterministic later (Flow C).

### `constraints.md`

- Tech stack choices
- Patterns to follow
- Explicit non-goals ("No SMS auth in v1")

---

## Pipeline (Flow B only)

```
User natural language input
  │
  ▼
Step 1: Parse intent (LLM)
  - classify: new feature, change, question, constraint, …
  │
  ▼
Step 2: Router (LLM, structured output)
  - which spec files to update
  - which operations: add, update, link
  │
  ▼
Step 3: Writers (LLM, one call per target file)
  - patch only affected sections
  - preserve stable IDs
  - write acceptance criteria + agent instructions
  │
  ▼
Step 4: Validator (non-LLM)
  - IDs unique, feature↔task links valid, INDEX complete
  - optional LLM: contradiction check across files
  │
  ▼
Step 5: Human review (gate)
  - user approves or edits before spec is "committed"
  │
  ▼
/spec/*.md  →  (later) visual layer cards
```

No repo ingest required for v0.

### Interaction model (locked)

- **Chat → preview → commit** — translator runs as a **batch** with full canvas + spec context; user commits or discards
- **Manual card edit** — user edits individual cards anytime; syncs MD without AI
- **Not real-time execution** — NLIDE builds a clear intent picture first; external agents run later with exported `/spec`

See **[workflow.md](../product/workflow.md)**.

---

## Writing rules (Flow B)

1. **Intent, not implementation** — what the user wants, not how code is structured today
2. **Acceptance criteria required** — every feature must say what "done" means
3. **Agent instructions in tasks** — numbered steps agents can follow
4. **Stable IDs** — `F-001`, `T-001` survive edits to wording
5. **Open questions explicit** — ask user instead of guessing ("Which Google domains are allowed?")
6. **No source file refs as primary content** — optional in architecture, not the main artifact

### Good vs bad

| Bad | Good |
|-----|------|
| "Add a button to LoginForm.tsx" | "Users can sign in with Google" |
| "Use OAuth" (vague) | "Acceptance: OAuth flow completes; only @company.com domains allowed" |
| "Make it work" | "Done when: admin can revoke access from admin panel" |

---

## Single command (target)

```bash
nlide intent add "Add Google login for enterprise users"
nlide intent chat   # interactive session updating spec
```

Input: user natural language  
Output: updated `spec/` directory

---

## Success criteria for v0

- [ ] User can describe a feature in plain language
- [ ] System updates correct spec files (`features`, `tasks`, etc.)
- [ ] Output includes acceptance criteria and agent-ready task instructions
- [ ] Human can review MD and understand exactly what was captured
- [ ] A separate agent (Cursor, etc.) could read `tasks.md` and implement with minimal ambiguity
- [ ] `INDEX.md` links everything; no orphan IDs

---

## Out of scope (v0)

- Flow A — repo → MD (deferred; optional import later)
- Flow C — MD → code (execution agents, not NLIDE)
- Full visual IDE chrome (read/edit MD or simple cards is enough)
- Automatic sync from existing codebase
- Mem0 / vector memory

---

## Later

- **Visual layer** — cards for Product, Users, Features, Open Questions; user edits cards → Flow B
- **Flow A (optional)** — import from existing repo as bootstrap, with translate layer into intent-shaped spec
- **Flow C** — wire execution agents to read `/spec`; not built into NLIDE
