# NLIDE — Spec Index

Natural Language IDE — an intent canvas where humans define what to build; agents execute from exported spec.

## Spec files

| File | Scope |
|------|-------|
| `product.md` | What we are building and why — vision, goals, scope |
| `users.md` | Target users, personas, pain points, use cases |
| `features.md` | Feature list with acceptance criteria (F-001, …) |
| `architecture.md` | High-level system design — Frontend, Backend, components |
| `tasks.md` | Agent-executable work items (T-001, …) |
| `constraints.md` | Stack, patterns, non-goals, limits |
| `decisions.md` | Resolved choices — ADR-style (D-001, …) |
| `open-questions.md` | Unresolved decisions needing user input (OQ-001, …) |

## Agent routing rules

1. **Start here.** Read `constraints.md` before `architecture.md`.
2. Tasks in `tasks.md` reference feature IDs in `features.md` — follow **Feature:** links.
3. Unresolved items live in `open-questions.md` — do not guess; ask the user.
4. Locked choices are in `decisions.md` — respect **Status: locked**.
5. Intent-level spec only — no source file paths as primary requirements.

_Exported 2026-06-06 — NLIDE Flow B v0_
