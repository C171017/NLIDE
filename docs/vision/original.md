# Natural Language IDE — Original Vision

This document preserves the original vision and intent in the author's own words, grouped as one continuous narrative.

---

## Vision

A development environment where the primary artifact is intent rather than code.

Humans interact with understandable concepts.

Agents interact with structured specifications.

The platform continuously synchronizes both views.

---

## Core Principle

Traditional IDE:

Human → Code → Compiler

Natural Language IDE:

Human → Intent → Agent → Code

---

## Layer 1: Human Layer

### Purpose

Provide a simple and understandable representation of the project.

### Characteristics

- Natural language
- Visual
- Easy to edit
- Easy to review
- Easy to approve

### Example Sections

#### Product Vision

- What are we building?
- Why are we building it?

#### Users

- Who is the target user?
- What are their pain points?

#### Features

- Feature list
- Priority
- Status

#### Architecture Overview

- Visual diagrams
- System relationships

#### Open Questions

- Unresolved decisions
- Risks
- Assumptions

#### Agent Activity Feed

- What agents are currently doing
- Recent decisions
- Suggested actions

---

## Layer 2: Agent Layer

### Purpose

Provide structured knowledge that agents can reliably execute against.

### Characteristics

- Markdown-based
- Version-controlled
- Structured
- Machine-readable

### Example Files

- `/spec/product.md`
- `/spec/users.md`
- `/spec/features.md`
- `/spec/architecture.md`
- `/spec/tasks.md`
- `/spec/constraints.md`
- `/spec/roadmap.md`
- `/spec/decisions.md`

---

## Synchronization Engine

### Human → Agent

User edits:

"Support Google login"

System updates:

- `features.md`
- `architecture.md`
- `tasks.md`

### Agent → Human

Agent discovers:

"OAuth service required"

System creates:

New Architecture Card

User approves or rejects.

---

## Key Idea

The user never edits prompt files directly.

The user edits intent.

The system generates and maintains the structured agent context automatically.

---

## Long-Term Vision

Natural Language IDE becomes:

- Source of Truth for product intent
- Source of Truth for agent memory
- Source of Truth for implementation planning

Instead of:

Notion + Whimsical + Linear + Prompt files + Agent memory

Everything lives inside a single Intent Operating System.

---

## Tagline

"Cursor is an IDE for code.

Natural Language IDE is an IDE for intent."

---

## Additional Thoughts on Structure and UX

For my Natural Language IDE, I'm thinking of maybe having several layers — maybe 2 for now.

One is the upper user level, where they are easy understandable texts user can edit and view if the thing aligns with what they want.

The layer below is structured md files, which is for agent to execute.

The IDE — even though we call it IDE — is just a fast and intuitive way to let people understand. The reality is that natural language coding is relatively very new, and IDE was developed for high-level coding language. So what I imagine the Natural Language IDE should have much greater UI/UX, and the structure is easy for Agent to follow.
