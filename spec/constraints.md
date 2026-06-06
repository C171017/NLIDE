# Constraints

## Stack

- React 18 + TypeScript + Vite frontend
- InsForge Postgres + edge functions backend
- React Flow for canvas; TipTap for card editing
- OpenRouter for translator LLM (when configured)

## Patterns

- Intent wording in spec — not source file paths as primary requirements
- Preview → commit gate — no silent spec writes
- Stable IDs: F-xxx, T-xxx, D-xxx, OQ-xxx
- Hybrid storage: Postgres runtime; `/spec` markdown export on commit

## Non-goals

- No mobile v0
- No in-app agent execution loops
- No auth in v0
- No real-time multi-user collaboration
