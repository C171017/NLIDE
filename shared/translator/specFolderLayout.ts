/**
 * spec/ folder layout — Phase 6 · Job 2.
 * **[USER]** approved 2026-06-06 before commit export ships.
 *
 * Physical tree, per-file headers/scaffolds, section assembly order, and write path —
 * matches Flow B v0 file list (exportScopeOnCommit full-tree export).
 */

import { SPEC_FILE_ALLOWLIST } from './intentTypes.ts'

export type SpecFileKind = 'index' | 'entity-sections' | 'doc-sections'

export interface SpecFileLayout {
  file: string
  kind: SpecFileKind
  h1: string
  scopeBlurb: string
  /** ## blocks for doc-sections files; empty for entity-sections. */
  docSections?: string[]
  /** Entity ID prefix for sort order (F, T, D, OQ). */
  entityPrefix?: string
  emptyScaffold: string
  sectionSource: string
}

export interface SpecFolderLayout {
  policy: string
  rootPath: string
  files: SpecFileLayout[]
  assemblyRules: string[]
  sectionOrdering: string[]
  indexTemplate: string
  writePath: string[]
  commitResponseShape: string[]
  gitTracking: string[]
  examples: { label: string; path: string; snippet: string }[]
  explicitNonGoals: string[]
}

/** Scope blurbs for INDEX.md file table — aligned with flow-b-v0.md. */
export const SPEC_FILE_SCOPE_BLURBS: Record<string, string> = {
  'INDEX.md': 'Entry point — project summary, file index, agent routing rules',
  'product.md': 'What we are building and why — vision, goals, scope',
  'users.md': 'Target users, personas, pain points, use cases',
  'features.md': 'Feature list with acceptance criteria (F-001, …)',
  'architecture.md': 'High-level system design — no source file paths',
  'tasks.md': 'Agent-executable work items (T-001, …)',
  'constraints.md': 'Stack, patterns, non-goals, limits',
  'decisions.md': 'Resolved choices — ADR-style (D-001, …)',
  'open-questions.md': 'Unresolved decisions needing user input (OQ-001, …)',
}

export const SPEC_FOLDER_LAYOUT: SpecFolderLayout = {
  policy:
    'Exported spec lives at repo root `spec/` — flat directory, nine markdown files only, ' +
    'matching SPEC_FILE_ALLOWLIST and flow-b-v0.md. No subfolders in v0. Each file has a fixed H1, ' +
    'deterministic section order, and an empty scaffold until writers or manual edits populate content.',

  rootPath: 'spec/',

  files: [
    {
      file: 'INDEX.md',
      kind: 'index',
      h1: '# NLIDE Spec Index',
      scopeBlurb: SPEC_FILE_SCOPE_BLURBS['INDEX.md'],
      emptyScaffold: '',
      sectionSource: 'Regenerated on export from projects.name + product.md vision + file table (exportScopeOnCommit).',
    },
    {
      file: 'product.md',
      kind: 'doc-sections',
      h1: '# Product',
      scopeBlurb: SPEC_FILE_SCOPE_BLURBS['product.md'],
      docSections: ['Vision', 'Goals', 'Scope', 'Non-goals'],
      emptyScaffold: `# Product

## Vision
_(empty — describe what you are building via chat or Product card.)_

## Goals

## Scope

## Non-goals
`,
      sectionSource: 'Per-file card + remainingWritersOrder product writer; anchor "" or section name in spec_sections.',
    },
    {
      file: 'users.md',
      kind: 'doc-sections',
      h1: '# Users',
      scopeBlurb: SPEC_FILE_SCOPE_BLURBS['users.md'],
      docSections: ['Primary users', 'Personas', 'Pain points', 'Use cases'],
      emptyScaffold: `# Users

## Primary users
_(empty)_

## Personas

## Pain points

## Use cases
`,
      sectionSource: 'Users card + update_product writer.',
    },
    {
      file: 'features.md',
      kind: 'entity-sections',
      h1: '# Features',
      scopeBlurb: SPEC_FILE_SCOPE_BLURBS['features.md'],
      entityPrefix: 'F',
      emptyScaffold: `# Features

_(No features yet — describe what to build in chat.)_
`,
      sectionSource: 'One spec_sections row per F-xxx; heading ### F-xxx: title per featuresWriterTemplate.',
    },
    {
      file: 'architecture.md',
      kind: 'doc-sections',
      h1: '# Architecture',
      scopeBlurb: SPEC_FILE_SCOPE_BLURBS['architecture.md'],
      docSections: ['Overview', 'Components', 'Relationships', 'Canvas IA'],
      emptyScaffold: `# Architecture

## Overview
_(empty)_

## Components

## Relationships

## Canvas IA
`,
      sectionSource: 'Architecture card + remainingWritersOrder architecture writer.',
    },
    {
      file: 'tasks.md',
      kind: 'entity-sections',
      h1: '# Tasks',
      scopeBlurb: SPEC_FILE_SCOPE_BLURBS['tasks.md'],
      entityPrefix: 'T',
      emptyScaffold: `# Tasks

_(No tasks yet — add via chat when features are defined.)_
`,
      sectionSource: 'One spec_sections row per T-xxx; heading ### T-xxx: title per taskWriterRules.',
    },
    {
      file: 'constraints.md',
      kind: 'doc-sections',
      h1: '# Constraints',
      scopeBlurb: SPEC_FILE_SCOPE_BLURBS['constraints.md'],
      docSections: ['Stack', 'Patterns', 'Non-goals'],
      emptyScaffold: `# Constraints

## Stack

## Patterns

## Non-goals
`,
      sectionSource: 'Constraints card + add_constraint writer.',
    },
    {
      file: 'decisions.md',
      kind: 'entity-sections',
      h1: '# Decisions',
      scopeBlurb: SPEC_FILE_SCOPE_BLURBS['decisions.md'],
      entityPrefix: 'D',
      emptyScaffold: `# Decisions

_(No recorded decisions yet.)_
`,
      sectionSource: 'One spec_sections row per D-xxx; heading ### D-xxx: title per remainingWritersOrder.',
    },
    {
      file: 'open-questions.md',
      kind: 'entity-sections',
      h1: '# Open questions',
      scopeBlurb: SPEC_FILE_SCOPE_BLURBS['open-questions.md'],
      entityPrefix: 'OQ',
      emptyScaffold: `# Open questions

_(No open questions — translator adds OQ-xxx on clarify intent.)_
`,
      sectionSource: 'One spec_sections row per OQ-xxx; heading ### OQ-xxx: title per remainingWritersOrder.',
    },
  ],

  assemblyRules: [
    'Load all spec_sections rows for project_id; group by file column.',
    'For entity-sections files: concatenate section content ordered by numeric ID suffix (F-001 before F-002).',
    'For doc-sections files: if rows exist, merge by ## heading; else emit emptyScaffold.',
    'For INDEX.md: call generateIndexMd(project, assembledSpec) — never read from spec_sections.',
    'Prepend file h1 if assembled body does not already start with it; writers emit ### sections only.',
    'Separate sections with exactly one blank line (\\n\\n).',
    'Trim trailing whitespace; end each file with single trailing newline.',
    'If file has zero sections and is entity-sections → use emptyScaffold (placeholder line under H1).',
  ],

  sectionOrdering: [
    'Entity files: sort by parseInt(id.split("-")[1]) — F-001, F-002, … T-003, D-001, OQ-001.',
    'OQ-xxx uses same numeric sort on the digits after OQ-.',
    'Doc files: fixed docSections order from this brief; unknown ## blocks append at end alphabetically.',
    'Within a section row, content is stored verbatim — no reformatting on export.',
  ],

  indexTemplate: `# {project_name} — Spec Index

{summary_paragraph}

## Spec files

| File | Scope |
|------|-------|
{file_table_rows}

## Agent routing rules

1. **Start here.** Read \`constraints.md\` before \`architecture.md\`.
2. Tasks in \`tasks.md\` reference feature IDs in \`features.md\` — follow **Feature:** links.
3. Unresolved items live in \`open-questions.md\` — do not guess; ask the user.
4. Locked choices are in \`decisions.md\` — respect **Status: locked**.
5. Intent-level spec only — no source file paths as primary requirements.

_Exported {iso_timestamp} — NLIDE Flow B v0_`,

  writePath: [
    'Repo path: `{repoRoot}/spec/{file}` — flat, no subdirectories.',
    'Edge function assembles content in memory; cannot write to developer laptop directly.',
    'action:commit response includes exportedSpec: Record<file, content> for all nine files (Job 1 full-tree).',
    'Agent mode: add writeSpecToDisk(exportedSpec, repoRoot) in shared/translator — invoked by dev CLI or local commit hook.',
    'Dev workflow: npm run export:spec (optional script) writes API response to ./spec/ after commit — Job 3 smoke documents exact command.',
    'Production/hosted: user downloads spec bundle or clones repo after CI writes spec/ from commit webhook (post-v0).',
  ],

  commitResponseShape: [
    '{ committed: true, previewId, cards, edges, exportedSpec: { "INDEX.md": "...", ... } }',
    'exportedSpec keys must equal SPEC_FILE_ALLOWLIST — same order as files[] in this brief.',
    'Frontend may show "Spec exported (9 files)" in commit toast; disk write is dev/Agent concern.',
  ],

  gitTracking: [
    'spec/ directory is git-tracked at repo root (tech-stack.md repo layout).',
    'First commit creates or overwrites all nine files — no .gitignore on spec/*.md.',
    'Optional spec/.gitkeep before first export so empty folder exists in clone — Agent mode choice.',
  ],

  examples: [
    {
      label: 'Empty project first export',
      path: 'spec/features.md',
      snippet: `# Features

_(No features yet — describe what to build in chat.)_
`,
    },
    {
      label: 'One feature assembled',
      path: 'spec/features.md',
      snippet: `# Features

### F-001: Canvas interaction

- **Status:** approved
- **Priority:** high
- **Description:** Users can pan, zoom, and navigate the intent canvas.
- **Acceptance criteria:**
  - User can drag to pan the canvas viewport
  - User can zoom with scroll wheel or pinch
`,
    },
    {
      label: 'INDEX.md row',
      path: 'spec/INDEX.md',
      snippet: `| \`features.md\` | Feature list with acceptance criteria (F-001, …) |`,
    },
  ],

  explicitNonGoals: [
    'No spec/subfolders/ (e.g. spec/features/F-001.md) — flat v0 only.',
    'No roadmap.md, ui.md, or files outside SPEC_FILE_ALLOWLIST.',
    'No YAML front matter on exported files in v0.',
    'No partial INDEX — always full regenerated index on every commit.',
    'No InsForge Storage bucket as primary export target in v0 — repo spec/ is canonical for agents.',
  ],
}

/** Lookup layout entry for a spec file. */
export function getSpecFileLayout(
  file: string,
  layout: SpecFolderLayout = SPEC_FOLDER_LAYOUT,
): SpecFileLayout | undefined {
  return layout.files.find((entry) => entry.file === file)
}

/** Generate INDEX.md content from project metadata and assembled spec map. */
export function generateIndexMd(input: {
  projectName: string
  summaryParagraph: string
  exportedAt?: string
  layout?: SpecFolderLayout
}): string {
  const layout = input.layout ?? SPEC_FOLDER_LAYOUT
  const timestamp = input.exportedAt ?? new Date().toISOString().slice(0, 10)

  const fileTableRows = SPEC_FILE_ALLOWLIST.filter((f) => f !== 'INDEX.md')
    .map((file) => {
      const entry = getSpecFileLayout(file, layout)
      const blurb = entry?.scopeBlurb ?? SPEC_FILE_SCOPE_BLURBS[file] ?? ''
      return `| \`${file}\` | ${blurb} |`
    })
    .join('\n')

  return layout.indexTemplate
    .replace('{project_name}', input.projectName)
    .replace('{summary_paragraph}', input.summaryParagraph)
    .replace('{file_table_rows}', fileTableRows)
    .replace('{iso_timestamp}', timestamp)
}

/** Assemble one spec file from section rows (export helper for Agent mode). */
export function assembleSpecFile(
  file: string,
  sections: { anchor: string; content: string }[],
  layout: SpecFolderLayout = SPEC_FOLDER_LAYOUT,
): string {
  const entry = getSpecFileLayout(file, layout)
  if (!entry) return ''

  if (entry.kind === 'index') {
    throw new Error('INDEX.md is generated via generateIndexMd(), not assembleSpecFile()')
  }

  if (sections.length === 0) {
    return entry.emptyScaffold.endsWith('\n') ? entry.emptyScaffold : `${entry.emptyScaffold}\n`
  }

  const sorted =
    entry.kind === 'entity-sections' && entry.entityPrefix
      ? [...sections].sort((a, b) => {
          const num = (anchor: string) => {
            const match = anchor.match(/(\d+)$/)
            return match ? parseInt(match[1], 10) : 0
          }
          return num(a.anchor) - num(b.anchor)
        })
      : sections

  const body = sorted.map((s) => s.content.trim()).join('\n\n')
  const h1 = entry.h1

  if (body.startsWith('#')) {
    return `${body.trim()}\n`
  }

  return `${h1}\n\n${body}\n`
}

/** Flatten brief for Agent mode or exporter assembly. */
export function formatSpecFolderLayout(
  layout: SpecFolderLayout = SPEC_FOLDER_LAYOUT,
): string {
  const section = (title: string, lines: string[]) =>
    [`## ${title}`, ...lines.map((l) => `- ${l}`)].join('\n')

  const fileBlocks = layout.files
    .map(
      (f) =>
        `### ${f.file} (${f.kind})\n` +
        `- H1: ${f.h1}\n` +
        `- Scope: ${f.scopeBlurb}\n` +
        (f.docSections ? `- Doc sections: ${f.docSections.join(' → ')}\n` : '') +
        (f.entityPrefix ? `- Entity prefix: ${f.entityPrefix}-xxx\n` : '') +
        `- Source: ${f.sectionSource}`,
    )
    .join('\n\n')

  const exampleBlock = layout.examples
    .map((ex) => `### ${ex.label} (\`${ex.path}\`)\n\`\`\`markdown\n${ex.snippet.trim()}\n\`\`\``)
    .join('\n\n')

  return [
    '## Policy',
    layout.policy,
    '',
    `## Root path\n\`${layout.rootPath}\` — ${SPEC_FILE_ALLOWLIST.length} files, flat layout.`,
    '',
    '## Files',
    fileBlocks,
    '',
    section('Assembly rules', layout.assemblyRules),
    '',
    section('Section ordering', layout.sectionOrdering),
    '',
    '## INDEX.md template',
    '```markdown',
    layout.indexTemplate,
    '```',
    '',
    section('Write path', layout.writePath),
    '',
    section('Commit response shape', layout.commitResponseShape),
    '',
    section('Git tracking', layout.gitTracking),
    '',
    '## Examples',
    exampleBlock,
    '',
    section('Explicit non-goals', layout.explicitNonGoals),
  ].join('\n')
}
