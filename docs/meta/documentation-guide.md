# Documentation Guide for Agents

**Read this before changing product design, architecture, or implementation.**

NLIDE docs are the **source of truth** for humans and coding agents. Code can drift; docs must not. When the user changes design, or you infer new design during implementation, **update the docs in the same session**.

---

## Doc map

| Path | Purpose | Update when |
|------|---------|-------------|
| [user-decisions.md](./user-decisions.md) | **User-defined** — explicit choices | User states a preference, scope change, or “we want X” |
| [ai-inferred-decisions.md](./ai-inferred-decisions.md) | **AI-inferred** — agent-chosen defaults | You pick stack, schema, UX detail user did not specify |
| [../implementation/current-state.md](../implementation/current-state.md) | What is **built and deployed now** | Code, infra, or wiring changes |
| [../vision/original.md](../vision/original.md) | User's original words | Rarely — only if user revises vision narrative |
| [../vision/structured.md](../vision/structured.md) | Structured vision breakdown | Vision-level scope shifts |
| [../product/workflow.md](../product/workflow.md) | Product workflow (batch, preview, commit) | User changes how NLIDE behaves |
| [../product/canvas-ui-vision.md](../product/canvas-ui-vision.md) | Canvas UI, cards, viz catalog | User changes UI/UX intent |
| [../product/tech-stack.md](../product/tech-stack.md) | Locked stack + InsForge | User locks/overrides stack; infra deployed |
| [../architecture/flow-b-v0.md](../architecture/flow-b-v0.md) | Flow B translator spec | Intent MD schema or pipeline changes |
| [../architecture/translator-internals.md](../architecture/translator-internals.md) | Translator pipeline (router/writers/stub) | LLM or preview pipeline changes |
| [../architecture/translator-platform.md](../architecture/translator-platform.md) | Platform overview | Cross-cutting architecture changes |
| [../README.md](../README.md) | Doc index | New top-level doc sections |
| [../../insforge/README.md](../../insforge/README.md) | InsForge setup & live URLs | Deploy, migration, function URL changes |
| [../../AGENTS.md](../../AGENTS.md) | InsForge SDK/CLI pointers | InsForge link or skills change |

---

## Two categories — always label clearly

Every design decision belongs in **exactly one** of these buckets:

### User-defined

The user **explicitly said** it in conversation. Do not guess.

- Mark with: `**[USER]**` in prose, or a table row in [user-decisions.md](./user-decisions.md)
- Examples: “start with Flow B”, “preview then commit”, “use Claude”, “not real-time execution”
- **Do not move** to AI-inferred without user confirmation
- If user contradicts an old decision, **update user-decisions.md** and note the date/change

### AI-inferred

You (the agent) **chose** it because the user did not specify, or only gave a goal.

- Mark with: `**[AI-INFERRED]**` in prose, or a row in [ai-inferred-decisions.md](./ai-inferred-decisions.md)
- Examples: React Flow over tldraw, Postgres column names, stub translator behavior
- User can override anytime → move row to user-decisions.md when they confirm
- Revisit when user says “change the design” or “why did you pick X?”

---

## When to update docs (mandatory)

| Trigger | Actions |
|---------|---------|
| User changes design or scope | Update [user-decisions.md](./user-decisions.md) + affected product/architecture docs |
| User confirms an AI suggestion | Move decision from ai-inferred → user-decisions |
| You implement something new | Update [current-state.md](../implementation/current-state.md) |
| You add/change API, DB, or deploy | Update [insforge/README.md](../../insforge/README.md) + current-state |
| Translator pipeline changes | Update flow-b-v0, translator-platform, current-state |
| New viz type or card behavior | Update canvas-ui-vision + current-state |
| Deferred / out-of-scope shift | Update structured.md scope sections + mark old text “superseded” |

**Rule:** If you changed code or explained a new design in chat, update docs **before** ending the task.

---

## How to update (format)

1. **User decision** — add to `user-decisions.md`:

```markdown
| Date | Decision | User quote / paraphrase | Docs updated |
|------|----------|-------------------------|--------------|
| 2026-06-06 | Flow B first | "start with B" | flow-b-v0, translator-platform |
```

2. **AI-inferred** — add to `ai-inferred-decisions.md`:

```markdown
| Date | Decision | Rationale | Revisable? | Superseded by |
|------|----------|-----------|------------|---------------|
| 2026-06-06 | React Flow for canvas | Node graph fits Index hub | Yes — user may prefer tldraw | — |
```

3. **Implementation** — update `current-state.md` checklist and “Live infra” section.

4. **Cross-link** — if a doc section becomes stale, add at top:

```markdown
> **Superseded:** See [user-decisions.md](../meta/user-decisions.md) — Flow A deferred as of 2026-06-06.
```

---

## What not to put in user-decisions

- Stack choices the user never mentioned (→ ai-inferred)
- Implementation details (file paths, SQL) unless user asked (→ current-state)
- Hackathon logistics unless user stated (→ ai-inferred or current-state)

---

## Agent workflow checklist

Before finishing a task:

- [ ] Did the user state a new preference? → `user-decisions.md`
- [ ] Did I choose something unstated? → `ai-inferred-decisions.md`
- [ ] Did I write or deploy code? → `current-state.md`
- [ ] Did InsForge URLs/migrations/functions change? → `insforge/README.md`
- [ ] Did product behavior change? → `workflow.md` / `canvas-ui-vision.md` / `flow-b-v0.md`

---

## Priority when docs conflict

1. **[USER] user-decisions.md** — wins over everything
2. **implementation/current-state.md** — wins for “what exists today”
3. **product/architecture docs** — target design
4. **[AI-INFERRED] ai-inferred-decisions.md** — default until user overrides
5. **vision/original.md** — narrative; may lag behind scope cuts

If conflict found, fix docs and note the resolution in user-decisions or current-state.
