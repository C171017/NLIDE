# Product

## Vision

NLIDE is a Natural Language IDE — an intent canvas where humans define what to build visually; agents execute from exported spec.

## Goals

- Capture user intent as structured, agent-executable markdown
- Visual canvas with linked cards backed by spec files
- Chat → preview → commit gate before spec changes apply
- Export full `spec/` tree for external agents on commit

## Scope

- Flow B: human input → intent MD (v0 focus)
- Layered intent canvas with Product · Frontend · Backend pillars
- Translator pipeline: router → writers → validator → canvas mapper
- InsForge backend: Postgres runtime + edge function API

## Non-goals

- In-app code execution (Flow C)
- Real-time streaming copilot on canvas
- Auth in v0
- Flow A repo import (deferred)
