/**
 * Export scope on commit — Phase 6 · Job 1.
 * **[USER]** approved 2026-06-06 before commit export ships.
 *
 * Whether commit writes the full spec/ tree or only delta files — hybrid storage
 * apply model (Postgres deltas) vs git-tracked export materialization.
 */

import { SPEC_FILE_ALLOWLIST } from './intentTypes.ts'

export type ExportScopeMode = 'full-tree' | 'delta-only'

export interface ExportScopeExample {
  id: string
  label: string
  scenario: string
  mdPatchesThisCommit: string[]
  filesWrittenToSpec: string[]
  notes: string
}

export interface ExportScopeOnCommit {
  policy: string
  /** Locked v0 choice — full-tree, not delta-only. */
  exportMode: ExportScopeMode
  runtimeStorage: string[]
  exportMaterialization: string[]
  commitPipeline: string[]
  manualCardEditRules: string[]
  indexRegeneration: string[]
  validationGates: string[]
  exportTriggers: string[]
  nonExportTriggers: string[]
  unchangedFileBehavior: string[]
  emptyProjectBehavior: string[]
  examples: ExportScopeExample[]
  explicitNonGoals: string[]
}

export const EXPORT_SCOPE_ON_COMMIT: ExportScopeOnCommit = {
  policy:
    'On commit, NLIDE exports the **full spec/ tree** — all nine Flow B allowlist files — ' +
    'materialized from Postgres spec_sections. Preview mdPatches are **deltas applied at commit time**; ' +
    'export is always a complete snapshot, never “changed files only”. External agents and git need the whole spec.',

  exportMode: 'full-tree',

  runtimeStorage: [
    'Postgres spec_sections(project_id, file, anchor, content) — canonical runtime MD while designing.',
    'Each entity section (F-xxx, T-xxx, D-xxx, OQ-xxx) and doc-level block stored as one row per anchor.',
    'Commit applies preview.mdPatches → merge/replace sections in spec_sections (same merge rules as applyPatchesToSpec).',
    'Manual patch-card updates the matching spec_section row immediately — card body ↔ section content stay in sync.',
    'cards + canvas_edges tables remain the canvas runtime; spec_sections is the spec runtime (hybrid storage C).',
  ],

  exportMaterialization: [
    'Assemble each allowlist file by concatenating ordered sections for that file from spec_sections.',
    'Write all SPEC_FILE_ALLOWLIST files on every commit — overwrite repo spec/*.md with assembled content.',
    'INDEX.md is **regenerated** from current project metadata + file inventory — not patched via mdPatches.',
    'Unchanged files are still rewritten — git diff shows only real content changes, not missing files.',
    'Export path and file headers/templates deferred to Phase 6 · Job 2 (spec/ folder layout).',
  ],

  commitPipeline: [
    '1. Load preview row by previewId; reject if missing or validation blocks commit.',
    '2. Apply preview.mdPatches to spec_sections (add/update sections by anchor).',
    '3. Sync any preview card body edits that diverged from spec_sections (card wins for in-preview manual edits).',
    '4. Assemble full spec map: Record<file, content> for all nine allowlist files.',
    '5. validate-spec(mode:commit) on assembled snapshot — blocksCommit rules fail the commit.',
    '6. Upsert cards + canvas_edges from preview (existing commitPreview behavior).',
    '7. Export full spec/ tree from assembled map + regenerated INDEX.md.',
    '8. Delete preview row; return { committed: true, exportedFiles: SPEC_FILE_ALLOWLIST }.',
  ],

  manualCardEditRules: [
    'patch-card (no AI) updates cards row + corresponding spec_section immediately.',
    'No /spec/*.md write on patch-card alone — user may edit many cards before next commit export.',
    'Next commit re-exports full tree including all manual edits since last commit.',
    'Stable IDs (F-001, T-001) preserved; card.specRef.file + specRef.anchor locate the section row.',
  ],

  indexRegeneration: [
    'INDEX.md is not a router writer target in v0 — regenerated deterministically on export.',
    'Contents: project name, one-paragraph summary (from product card or product.md), file table with scope blurbs.',
    'Agent routing rules block: start at INDEX, read constraints before architecture, tasks reference feature IDs.',
    'Regenerated every commit so links and file inventory always match exported tree.',
  ],

  validationGates: [
    'validatorStrictness commitBehavior — re-validate **full assembled spec** before Postgres write and export.',
    'blocksCommit issues → HTTP 4xx, preview row kept, no partial export.',
    'Warn-only issues → allow commit; optional warnings[] in commit response.',
    'Empty or scaffold-only spec allowed on first commit — validator info rules may warn, not block.',
  ],

  exportTriggers: [
    'POST action:commit with previewId — primary export trigger.',
    'Future optional: POST action:export-spec for manual re-export without new preview (Agent mode stretch).',
  ],

  nonExportTriggers: [
    'POST action:intent — preview only; mdPatches staged in preview row, not exported.',
    'POST action:discard — no spec write.',
    'POST action:patch-card — Postgres sync only; export waits for commit.',
    'Router/writer batch (action:run-writers) — validation helper; no export until user commits preview.',
  ],

  unchangedFileBehavior: [
    'Files with no mdPatches this commit are still written — content from spec_sections unchanged.',
    'Avoid delta-only export that omits untouched files — breaks agent handoff and INDEX completeness.',
    'Git tracks full tree; diff between commits shows per-file line changes only where content moved.',
  ],

  emptyProjectBehavior: [
    'First commit on empty project: export all nine files — scaffold headers where no sections exist yet.',
    'INDEX.md lists all files with “(empty)” or boilerplate scope lines until writers populate content.',
    'Canvas-only commits (no mdPatches) still export current spec_sections state + INDEX.',
  ],

  examples: [
    {
      id: 'ex-first-feature',
      label: 'First feature commit',
      scenario: 'User commits preview that adds F-002 + T-003',
      mdPatchesThisCommit: ['features.md [F-002]', 'tasks.md [T-003]'],
      filesWrittenToSpec: [...SPEC_FILE_ALLOWLIST],
      notes: 'Only two sections changed in Postgres; all nine files exported — six unchanged files rewritten as-is.',
    },
    {
      id: 'ex-manual-edit-then-commit',
      label: 'Manual card edit before commit',
      scenario: 'User edits F-001 acceptance criteria via Card editor, then commits unrelated preview',
      mdPatchesThisCommit: ['open-questions.md [OQ-002]'],
      filesWrittenToSpec: [...SPEC_FILE_ALLOWLIST],
      notes: 'F-001 body synced on patch-card; export includes manual F-001 edit even though features.md not in mdPatches.',
    },
    {
      id: 'ex-canvas-only-commit',
      label: 'Canvas position commit (no new MD)',
      scenario: 'User drags preview ghost cards and commits without new writer output',
      mdPatchesThisCommit: [],
      filesWrittenToSpec: [...SPEC_FILE_ALLOWLIST],
      notes: 'Cards/edges persist; spec export still runs — same content as last commit unless manual edits occurred.',
    },
  ],

  explicitNonGoals: [
    'No delta-only export (writing only files touched in this commit) — rejected for v0.',
    'No export on preview or discard (previewDiffRules + workflow.md).',
    'No streaming / incremental spec sync to external agents mid-session.',
    'No partial allowlist subset — always exactly SPEC_FILE_ALLOWLIST nine files.',
    'No roadmap.md or other files outside allowlist in v0 export.',
    'No export from edge function directly to user laptop — materialization returns content; Job 2 defines spec/ write path.',
  ],
}

/** Flatten brief for Agent mode or commit exporter assembly. */
export function formatExportScopeOnCommit(
  scope: ExportScopeOnCommit = EXPORT_SCOPE_ON_COMMIT,
): string {
  const section = (title: string, lines: string[]) =>
    [`## ${title}`, ...lines.map((l) => `- ${l}`)].join('\n')

  const exampleBlock = scope.examples
    .map(
      (ex) =>
        `### ${ex.label}\n${ex.scenario}\n` +
        `- mdPatches this commit: ${ex.mdPatchesThisCommit.length ? ex.mdPatchesThisCommit.join(', ') : '(none)'}\n` +
        `- Files written to spec/: ${ex.filesWrittenToSpec.join(', ')}\n` +
        `- Notes: ${ex.notes}`,
    )
    .join('\n\n')

  return [
    '## Policy',
    scope.policy,
    '',
    `## Export mode (v0 locked)\n**${scope.exportMode}** — not delta-only.`,
    '',
    section('Runtime storage (Postgres deltas)', scope.runtimeStorage),
    '',
    section('Export materialization (full tree)', scope.exportMaterialization),
    '',
    section('Commit pipeline', scope.commitPipeline),
    '',
    section('Manual card edit', scope.manualCardEditRules),
    '',
    section('INDEX.md regeneration', scope.indexRegeneration),
    '',
    section('Validation gates', scope.validationGates),
    '',
    section('Export triggers', scope.exportTriggers),
    '',
    section('Non-export triggers', scope.nonExportTriggers),
    '',
    section('Unchanged files', scope.unchangedFileBehavior),
    '',
    section('Empty project', scope.emptyProjectBehavior),
    '',
    '## Examples',
    exampleBlock,
    '',
    section('Explicit non-goals', scope.explicitNonGoals),
  ].join('\n')
}
