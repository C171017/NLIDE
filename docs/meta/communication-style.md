# Communication Style — How Agents Explain NLIDE Work

**[USER]** — how the user wants agents to explain design and next steps.

See also: [documentation-guide.md](./documentation-guide.md)

---

## The pattern (use this by default)

When the user asks “what are we doing?” or “what’s the next job?”, answer in **three layers**:

### 1. Plain-language reframe (one sentence)

Restate what we’re building in simple terms — often as a yes/no check:

> “So we’re basically building a **fixed list of intent types** — the translator reads your chat and picks which bucket it belongs in?”

Use words the user used. Avoid jargon first; introduce terms only after the plain sentence.

### 2. What we expect from the user (short list)

Bullet list of **concrete outputs** from the user — not code, not long essays:

- Approve / edit a list
- Pick yes/no on 2–3 policy calls
- Tick a checklist item when done

### 3. Progress (when work is phased)

Show where we are in a visible counter:

```
Step 1 contract: [██░░░░] 1/6 — Routing policy (you review the list)
```

Match the canvas **progress-checklist** card when relevant (`router-contract-v1`).

---

## Language rules

| Do | Don’t |
|----|--------|
| Short sentences, everyday words | Lead with “Router LLM structured JSON pipeline” |
| “Your job is to approve the list” | Long architecture essays before answering |
| One next job at a time | Dump all 6 checklist items as equal urgency |
| Say what we need **from you** explicitly | Assume the user knows which hat they’re wearing (product vs builder) |
| Separate **NLIDE chat intent** vs **building NLIDE in Cursor** | Treat every past chat message as a translator input |

---

## Two hats (always clarify when ambiguous)

| Hat | Where | Example |
|-----|--------|---------|
| **Product owner** | NLIDE canvas **chat box** | “Add pan and zoom to the canvas” → translator routes to spec |
| **Builder** | **Cursor** chat with the agent | “Reflect progress bar on canvas” → code change, not NLIDE translator |

When explaining router work, say which hat the request belongs to.

---

## Agent checklist before replying

- [ ] Did I start with a one-sentence plain reframe?
- [ ] Did I say what I need from the user (if anything)?
- [ ] Did I show progress (x/y) if we’re in a phased checklist?
- [ ] Did I distinguish NLIDE chat vs Cursor/build work?

---

## Change log

| Date | Change |
|------|--------|
| 2026-06-06 | **[USER]** Initial style — plain reframe, expect-from-user, progress bar |
