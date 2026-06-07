# NLIDE Documentation Index

Start here. Docs are maintained by **users and agents** — see [meta/documentation-guide.md](./meta/documentation-guide.md).

---

## For agents (read first)

| Doc | Purpose |
|-----|---------|
| **[meta/documentation-guide.md](./meta/documentation-guide.md)** | When and how to update docs; user vs AI-inferred rules |
| **[meta/user-decisions.md](./meta/user-decisions.md)** | **[USER]** — explicit user choices (do not override) |
| **[meta/communication-style.md](./meta/communication-style.md)** | **[USER]** — plain-language explanations + progress |
| **[meta/ai-inferred-decisions.md](./meta/ai-inferred-decisions.md)** | **[AI-INFERRED]** — agent defaults (revisable) |
| **[implementation/current-state.md](./implementation/current-state.md)** | What is built and deployed **right now** |

---

## Vision

| Doc | Label |
|-----|-------|
| [vision/original.md](./vision/original.md) | User narrative |
| [vision/structured.md](./vision/structured.md) | Structured breakdown |

---

## Product & UX

| Doc | Label |
|-----|-------|
| [product/workflow.md](./product/workflow.md) | **[USER]** batch design loop |
| [product/canvas-ui-vision.md](./product/canvas-ui-vision.md) | **[USER]** canvas + **[AI-INFERRED]** v0 viz subset |
| [product/tech-stack.md](./product/tech-stack.md) | **[USER]** locked + **[AI-INFERRED]** implementation |
| [product/execution-phases.md](./product/execution-phases.md) | v2 shipped (Build plan) |

---

## Architecture

| Doc | Label |
|-----|-------|
| [architecture/translator-platform.md](./architecture/translator-platform.md) | Flow B overview |
| [architecture/translator-internals.md](./architecture/translator-internals.md) | **[AI-INFERRED]** translator pipeline |
| [architecture/router-intent-types-v0.md](./architecture/router-intent-types-v0.md) | **Approved** — intent types narrative; runtime: `shared/translator/` |
| [architecture/flow-b-v0.md](./architecture/flow-b-v0.md) | Flow B spec |
| [architecture/flow-a-v0.md](./architecture/flow-a-v0.md) | Deferred |

---

## Infrastructure

| Doc | Purpose |
|-----|---------|
| [../insforge/README.md](../insforge/README.md) | InsForge setup, URLs, deploy |
| [../AGENTS.md](../AGENTS.md) | InsForge SDK/CLI for coding agents |

---

## Label legend

- **[USER]** — explicitly requested by the user; update [user-decisions.md](./meta/user-decisions.md) when changed
- **[AI-INFERRED]** — chosen by implementer/agent; update [ai-inferred-decisions.md](./meta/ai-inferred-decisions.md) when changed
