/**
 * Preview vs committed diff rules — Phase 5 · Job 3.
 * **[USER]** approved 2026-06-06 before canvas mapper ships.
 *
 * How the UI distinguishes preview deltas from committed canvas state — ghost cards,
 * mdPatches summary, commit/discard behavior.
 */

export interface MdPatchDisplayRule {
  field: string
  format: string
  example: string
}

export interface PreviewDiffExample {
  id: string
  label: string
  scenario: string
  ghostCards: string[]
  ghostEdges: string[]
  updatedInPlace: string[]
  mdPatches: { file: string; action: string; anchor?: string; summary: string }[]
}

export interface PreviewDiffRules {
  policy: string
  diffAlgorithm: string[]
  ghostCardRules: string[]
  ghostEdgeRules: string[]
  updatedCardRules: string[]
  removedCardRules: string[]
  mdPatchRules: string[]
  mdPatchDisplay: MdPatchDisplayRule[]
  summaryRules: string[]
  uiSurfaces: string[]
  commitBehavior: string[]
  discardBehavior: string[]
  validationGates: string[]
  examples: PreviewDiffExample[]
  explicitNonGoals: string[]
}

export const PREVIEW_DIFF_RULES: PreviewDiffRules = {
  policy:
    'Preview is a full proposed canvas snapshot plus mdPatches — not a patch DSL. The UI ghosts only ' +
    'new cards and edges (ids absent from committed state). Updated existing cards render in place ' +
    'without ghost styling; their text changes are visible in the card editor when selected.',

  diffAlgorithm: [
    'committedCardIds = Set(committedCards.map(c => c.id))',
    'previewCardIds = preview.cards.filter(c => !committedCardIds.has(c.id)).map(c => c.id)',
    'Same for edges: previewEdgeIds = new edge ids only (IntentCanvas diffPreview).',
    'Active canvas = preview.cards/edges when preview non-null, else committed.',
    'No deep field-level diff in v0 — id presence is the only ghost trigger.',
  ],

  ghostCardRules: [
    'isPreview:true when card.id ∈ previewCardIds (CardNode.tsx).',
    'Style: border-dashed, opacity-80, sky "preview" badge.',
    'Draggable in preview — position included in commit payload.',
    'New pillar cards are non-goals in v0 — only entity/detail cards ghost.',
  ],

  ghostEdgeRules: [
    'isPreview:true when edge.id ∈ previewEdgeIds (LabeledEdge.tsx).',
    'Style: stroke #60a5fa, strokeDasharray 6 4.',
    'Committed edges keep solid gray stroke even if label changed in preview.',
  ],

  updatedCardRules: [
    'Existing card id with changed title/body/status/vizPayload → not ghost; renders as normal card.',
    'User can select and edit in Card editor tab — edits apply to preview snapshot until commit.',
    'Position unchanged per canvasPlacementRules update_card rules.',
    'Optional: viz table row add (stub F-004) updates in place on features card — no second ghost card.',
  ],

  removedCardRules: [
    'v0 preview does not delete committed cards — discard drops entire preview snapshot.',
    'No "removed" ghost or strikethrough styling in v0.',
    'Future: explicit remove_card op could hide card in preview only until commit.',
  ],

  mdPatchRules: [
    'mdPatches[] parallels operations[] — one entry per spec file change from writers.',
    'Fields: file (allowlist), action add|update|remove, optional anchor (entity id), summary (human line).',
    'Mapper builds mdPatches after writers run; router summary is separate one-liner.',
    'mdPatches-only preview (noop canvas delta) is valid — summary + patch list, no ghosts.',
    'Order: same as writer invocation order (features → tasks → remaining).',
  ],

  mdPatchDisplay: [
    {
      field: 'action',
      format: 'add | update | remove — verb prefix in UI list',
      example: 'add',
    },
    {
      field: 'file',
      format: '{action} · {file} — {summary}',
      example: 'add · features.md — Propose F-004 Google login feature',
    },
    {
      field: 'anchor',
      format: 'Shown implicitly in summary; anchor used for dedupe key with file',
      example: 'F-004',
    },
    {
      field: 'summary',
      format: 'Short human line; not full markdown body',
      example: 'Update F-001 acceptance criteria for pan/zoom',
    },
  ],

  summaryRules: [
    'preview.summary = router plan.summary (one sentence, user-facing).',
    'Shown in PreviewActions bar (always when preview active) and Card editor tab preview panel (lg+).',
    'Same text in both surfaces — no divergent copy in v0.',
    'If validation warnings exist, append below summary in Agent mode (not stub).',
  ],

  uiSurfaces: [
    'Canvas: ghost cards/edges via diffPreview.',
    'Side panel PreviewActions: summary + Commit / Discard buttons.',
    'Card editor tab: resizable "Preview summary" block with summary + mdPatches list.',
    'Build plan tab: unchanged during preview — user can still tick jobs.',
    'Chat bar: no inline diff — interpret button triggers preview load.',
  ],

  commitBehavior: [
    'POST action:commit with previewId — loads preview row from Postgres previews table.',
    'Writes all preview.cards → cards, preview.edges → canvas_edges (upsert by id).',
    'Deletes preview row; frontend sets committedCards/Edges from preview, clears preview state.',
    'Positions from preview payload persist — user drags in preview are committed.',
    'mdPatches applied to spec storage in Phase 6; v0 commit is Postgres canvas only.',
    'Resets drillFocusId and selectedCardId on commit.',
  ],

  discardBehavior: [
    'POST action:discard with previewId — deletes preview row only.',
    'Frontend clears preview; committed snapshot unchanged.',
    'Ghost cards/edges vanish immediately — no animation.',
    'Discard is safe default when user rejects translator output.',
  ],

  validationGates: [
    'action:run-writers + validate-spec(mode:preview) may return warnings — show in summary area.',
    'blocksPreview issues prevent preview payload from returning (fail loud, routerFailureBehavior policy).',
    'blocksCommit issues disable Commit button in Agent mode mapper (validatorStrictness).',
    'Stub preview skips validation — Phase 5 mapper wires real validator.',
  ],

  examples: [
    {
      id: 'ex-add-feature-oq',
      label: 'Stub preview (current buildPreview)',
      scenario: 'Chat adds F-004 row + open-question card',
      ghostCards: ['oq-{timestamp}'],
      ghostEdges: ['e-preview-oq-{timestamp}'],
      updatedInPlace: ['features'],
      mdPatches: [
        { file: 'open-questions.md', action: 'add', anchor: 'OQ-preview', summary: 'Add open question about allowed Google domains' },
        { file: 'features.md', action: 'add', anchor: 'F-004', summary: 'Propose F-004 Google login feature' },
      ],
    },
    {
      id: 'ex-update-feature-only',
      label: 'Update F-001 only (gp-01)',
      scenario: 'Router updates feature text; no new cards',
      ghostCards: [],
      ghostEdges: [],
      updatedInPlace: ['features'],
      mdPatches: [
        { file: 'features.md', action: 'update', anchor: 'F-001', summary: 'Add pan/zoom acceptance criteria' },
      ],
    },
    {
      id: 'ex-gp03-full',
      label: 'Add F-002 + T-003 (gp-03 mapper)',
      scenario: 'Two new entity cards + edges',
      ghostCards: ['F-002', 'T-003'],
      ghostEdges: ['e-product-F-002', 'e-F-002-T-003'],
      updatedInPlace: [],
      mdPatches: [
        { file: 'features.md', action: 'add', anchor: 'F-002', summary: 'Add Google login for enterprise users' },
        { file: 'tasks.md', action: 'add', anchor: 'T-003', summary: 'Implement Google OAuth login flow' },
      ],
    },
  ],

  explicitNonGoals: [
    'No side-by-side committed vs preview split view.',
    'No per-field markdown diff highlighting in v0.',
    'No ghost styling on updated existing cards — id-based diff only.',
    'No auto-commit; user must click Commit (workflow.md policy).',
    'No /spec/*.md write on commit until Phase 6.',
  ],
}

/** Flatten brief for Agent mode or mapper assembly. */
export function formatPreviewDiffRules(
  rules: PreviewDiffRules = PREVIEW_DIFF_RULES,
): string {
  const section = (title: string, lines: string[]) =>
    [`## ${title}`, ...lines.map((l) => `- ${l}`)].join('\n')

  const patchDisplay = rules.mdPatchDisplay
    .map((row) => `- **${row.field}** — ${row.format} (e.g. ${row.example})`)
    .join('\n')

  const exampleBlock = rules.examples
    .map((ex) => {
      const patches = ex.mdPatches
        .map((p) => `  - ${p.action} · ${p.file}${p.anchor ? ` [${p.anchor}]` : ''} — ${p.summary}`)
        .join('\n')
      return (
        `### ${ex.label}\n${ex.scenario}\n` +
        `- Ghost cards: ${ex.ghostCards.length ? ex.ghostCards.join(', ') : '(none)'}\n` +
        `- Ghost edges: ${ex.ghostEdges.length ? ex.ghostEdges.join(', ') : '(none)'}\n` +
        `- Updated in place: ${ex.updatedInPlace.length ? ex.updatedInPlace.join(', ') : '(none)'}\n` +
        `- mdPatches:\n${patches}`
      )
    })
    .join('\n\n')

  return [
    '## Policy',
    rules.policy,
    '',
    section('Diff algorithm', rules.diffAlgorithm),
    '',
    section('Ghost cards', rules.ghostCardRules),
    '',
    section('Ghost edges', rules.ghostEdgeRules),
    '',
    section('Updated existing cards', rules.updatedCardRules),
    '',
    section('Removed cards', rules.removedCardRules),
    '',
    section('mdPatches rules', rules.mdPatchRules),
    '',
    '## mdPatches display',
    patchDisplay,
    '',
    section('Summary line', rules.summaryRules),
    '',
    section('UI surfaces', rules.uiSurfaces),
    '',
    section('Commit', rules.commitBehavior),
    '',
    section('Discard', rules.discardBehavior),
    '',
    section('Validation gates', rules.validationGates),
    '',
    '## Examples',
    exampleBlock,
    '',
    section('Explicit non-goals', rules.explicitNonGoals),
  ].join('\n')
}
