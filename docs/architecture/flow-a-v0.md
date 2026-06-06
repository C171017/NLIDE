# Flow A — Repo → MD (Deferred)

**Status: not current focus.** We start with **[Flow B](./flow-b-v0.md)** (human input → intent MD). Flow A may return later as optional **import/bootstrap** from an existing codebase.

When built, Flow A would translate a codebase into human-readable markdown describing what the project does and how it breaks down into components — including concrete UI and behavior (e.g. a button and what it does). Output would be passed through a **translate layer** into intent-shaped spec, not used directly as the NLIDE source of truth.

Flow C (MD → Code) remains out of scope (execution agents).

---

## Goal

Given a repo, produce MD files that answer:

1. **What is this project?** — overall purpose, who it's for, what problem it solves
2. **What are the major parts?** — modules, pages, services, data flows
3. **What do specific pieces do?** — components down to interactive elements (buttons, forms, API endpoints, etc.)

The output is **logical and human-readable**, not a file-by-file mirror of the codebase.

---

## Example: Button detection

**In code** (`LoginForm.tsx`):

```tsx
<button onClick={handleSubmit}>Sign in</button>
```

**In MD** (`components/ui.md` or nested under a page section):

```markdown
### Sign in button (UI-003)

- **Where:** Login page
- **Label:** "Sign in"
- **What it does:** Submits the login form. Validates email and password, calls the auth API, and redirects to the dashboard on success. Shows an error message if credentials are invalid.
- **Source:** `src/components/LoginForm.tsx` (inferred)
- **Confidence:** inferred
```

The translator **detects** interactive and functional parts in code and **describes** them in plain language — what they are, what they do, and how they relate to the rest of the project.

---

## Output schema (v0)

Minimal file set for reverse engineering:

```
spec/
  INDEX.md           ← entry point: project name, one-paragraph summary, links to all files
  overview.md        ← what the project does (purpose, users, core value)
  components.md      ← major components/modules and how they relate
  ui.md              ← pages, screens, UI elements (buttons, forms, navigation)
  backend.md         ← APIs, services, data models (if present)
  open-questions.md  ← things the translator couldn't infer confidently
```

Not required for Flow A schema: full intent task breakdown — that belongs in Flow B's `tasks.md` with acceptance criteria.

### `INDEX.md`

Central node. Every agent read starts here.

- Project name
- One-paragraph summary
- Table of spec files with one-line descriptions
- Link graph (which files reference which)

### `overview.md`

High-level only:

- What are we building?
- Who is it for?
- What are the main capabilities?

### `components.md`

Logical breakdown, not file tree:

- Major modules (auth, dashboard, billing, …)
- How they connect
- Mermaid diagram optional

Each component gets a stable ID: `CMP-001`, `CMP-002`, …

### `ui.md`

Pages and interactive elements:

- **Pages/screens** — what each screen is for
- **UI elements** — buttons, links, inputs, menus with:
  - Label or identifier
  - Location (which page/section)
  - Behavior (what happens when used)
  - Source file reference (for traceability)
  - Confidence: `explicit` | `inferred`

Each element gets a stable ID: `UI-001`, `PG-001`, …

### `backend.md`

If the repo has a backend:

- API routes / endpoints and what they do
- Services and data models
- Same ID pattern: `API-001`, `SVC-001`

Skip or mark N/A for frontend-only repos.

### `open-questions.md`

Explicit uncertainty — do not hallucinate:

- "Auth mechanism unclear — JWT or session?"
- "Purpose of `utils/legacy/` unknown"

---

## Granularity rules

| Level | Describe | Example |
|-------|----------|---------|
| **Project** | Purpose, audience | "A task manager for small teams" |
| **Component** | Module responsibility | "Auth handles login and session" |
| **Page/screen** | What user sees/does here | "Settings page lets users change profile" |
| **UI element** | Specific control + behavior | "Save button persists profile changes" |
| **API/service** | What endpoint/service does | "POST /api/login returns session token" |

**Do describe:** buttons, forms, navigation, key handlers, routes, APIs  
**Do not describe:** every variable, every line, internal helpers unless user-facing

---

## Pipeline (Flow A only)

```
Repo
  │
  ▼
Step 1: Mechanical ingest (no LLM)
  - file tree, stack, README, routes, component files
  - ripgrep for: onClick, routes, API handlers, page components
  │
  ▼
Step 2: Signal extraction (LLM or AST-assisted)
  - list candidate components, pages, UI elements, endpoints
  │
  ▼
Step 3: Router (LLM)
  - map signals → target spec files (overview, components, ui, backend)
  │
  ▼
Step 4: Writers (LLM, one per file)
  - write human-readable descriptions with IDs and confidence tags
  │
  ▼
Step 5: Validator (non-LLM)
  - IDs unique, INDEX links all files, source refs present
  │
  ▼
/spec/*.md
```

### Step 1 — What to scan mechanically

| Signal | How |
|--------|-----|
| Stack | `package.json`, `pyproject.toml`, etc. |
| Routes/pages | `app/`, `pages/`, `routes/` |
| UI components | `components/`, `*.tsx`, `*.vue` |
| Buttons/actions | `onClick`, `@click`, `onPress`, form `submit` |
| APIs | `route.ts`, `api/`, controller files |
| README | Project intent if stated explicitly |

---

## Reverse engineering rules

1. **Logical, not literal** — describe behavior, not file sizes or line counts
2. **Traceable** — attach `source:` file path so humans can verify
3. **Tagged confidence** — `explicit` (from README/comments) vs `inferred` (from code analysis)
4. **Unknowns go to open-questions** — never silently guess
5. **Stable IDs** — `UI-003` stays stable if the description is updated

### Good vs bad

| Bad | Good |
|-----|------|
| "`Button.tsx` is 120 lines" | "The Delete button removes the selected item after confirmation" |
| "Uses React" | "Login page has email field, password field, and Sign in button" |
| "Probably handles auth" | "Sign in button calls auth API; mechanism inferred as JWT from token storage" |

---

## Single command (target)

```bash
nlide translate --from-repo ./some-project --output ./spec
```

Input: path to repo  
Output: populated `spec/` directory

---

## Success criteria for v0

- [ ] Running on a small real repo produces readable `overview.md`
- [ ] Major components identified in `components.md`
- [ ] At least key buttons/forms documented in `ui.md` with behavior
- [ ] Each claim has source reference or is in `open-questions.md`
- [ ] `INDEX.md` links everything; a human can understand the project without reading code

---

## Relationship to Flow B

Flow A produces **code-centric** descriptions (what exists in the repo).  
Flow B produces **intent-centric** spec (what the user wants).

If Flow A is added later:

```
Repo ──A──► code-description MD ──translate──► intent spec MD ◄── B ── user input
```

Do not skip the translate step — button-level code docs are not agent-executable intent.

---

## Out of scope (until Flow A is prioritized)

- Flow A as primary product path (B comes first)
- Flow C — MD → code execution
- Using A output directly as NLIDE spec without translation to intent
