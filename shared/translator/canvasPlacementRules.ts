/**
 * Canvas card placement rules — Phase 5 · Job 1.
 * **[AI-INFERRED]** draft for [USER] review before canvas mapper ships.
 *
 * How new preview cards get positioned on the layered canvas — near related nodes,
 * auto-layout vs preserving user drag positions.
 */

export type CardType =
  | 'product'
  | 'frontend'
  | 'backend'
  | 'users'
  | 'feature'
  | 'task'
  | 'architecture'
  | 'constraint'
  | 'decision'
  | 'open-question'

export interface PlacementAnchor {
  cardType: CardType
  layer: 0 | 1
  parentCardId?: string
  defaultOffset: { x: number; y: number }
  notes?: string
}

export interface CanvasPlacementRules {
  policy: string
  layerModel: string[]
  preserveDrag: string[]
  autoLayout: string[]
  defaultAnchors: PlacementAnchor[]
  newCardRules: string[]
  collisionRules: string[]
  updateCardRules: string[]
  examples: { label: string; placement: string }[]
  explicitNonGoals: string[]
}

/** Matches sampleProject.ts and canvasLayers.ts TOP_LAYER_SPREAD. */
export const TOP_LAYER_SPREAD = 520

export const CANVAS_PLACEMENT_RULES: CanvasPlacementRules = {
  policy:
    'New preview cards are placed near their semantic parent on the canvas. Committed cards ' +
    'keep user-dragged positions; preview-only cards use auto-layout offsets from the anchor rules below.',

  layerModel: [
    'Layer 0 (overview): Product center (0,0), Frontend left (-520,0), Backend right (+520,0).',
    'Layer 1 (detail): child cards under a pillar via parentCardId — visible when pillar is drilled into.',
    'centerCardId is always product — hub for radial layout in layout.ts.',
    'New entity cards (F-xxx, T-xxx, D-xxx, OQ-xxx) default to layer 1 unless they are pillar types.',
  ],

  preserveDrag: [
    'On commit: write position_x/position_y from preview payload to Postgres — becomes source of truth.',
    'On subsequent previews: start from committed positions; do not re-layout existing cards.',
    'User manual drag (patch-card) updates position immediately — mapper must not overwrite on next preview.',
    'Only cards with isPreview:true (or new in this preview) get auto-placed.',
  ],

  autoLayout: [
    'Use radial offset from parent center via layout.ts resolvePreviewPosition() — collision gap 48px.',
    'If parent not found, fall back to product hub (0,0) on layer 1 below hub (+y).',
    'Stack siblings: offset each new sibling by +80y or +NODE_WIDTH+GAP in parent\'s dominant direction.',
    'Prefer placing to the right of parent in detail layer when horizontal space exists.',
  ],

  defaultAnchors: [
    {
      cardType: 'product',
      layer: 0,
      defaultOffset: { x: 0, y: 0 },
      notes: 'Immutable hub — mapper never creates a second product card.',
    },
    {
      cardType: 'frontend',
      layer: 0,
      defaultOffset: { x: -TOP_LAYER_SPREAD, y: 0 },
    },
    {
      cardType: 'backend',
      layer: 0,
      defaultOffset: { x: TOP_LAYER_SPREAD, y: 0 },
    },
    {
      cardType: 'users',
      layer: 1,
      parentCardId: 'product',
      defaultOffset: { x: -280, y: -220 },
    },
    {
      cardType: 'feature',
      layer: 1,
      parentCardId: 'product',
      defaultOffset: { x: 0, y: 280 },
      notes: 'One card per F-xxx entity; aggregate features table card is demo-only until split.',
    },
    {
      cardType: 'task',
      layer: 1,
      parentCardId: 'frontend',
      defaultOffset: { x: -520, y: 280 },
      notes: 'Tasks live under Frontend pillar by default (implementation surface).',
    },
    {
      cardType: 'architecture',
      layer: 1,
      parentCardId: 'backend',
      defaultOffset: { x: 520, y: -220 },
    },
    {
      cardType: 'constraint',
      layer: 1,
      parentCardId: 'product',
      defaultOffset: { x: 280, y: -220 },
    },
    {
      cardType: 'decision',
      layer: 1,
      parentCardId: 'backend',
      defaultOffset: { x: 720, y: 280 },
    },
    {
      cardType: 'open-question',
      layer: 1,
      parentCardId: 'product',
      defaultOffset: { x: 520, y: -40 },
      notes: 'Near features/product — questions often block feature scope.',
    },
  ],

  newCardRules: [
    'add_feature → new feature card near product or existing features cluster; link edge product→feature or feature→feature.',
    'add_task → new task card near linked F-xxx feature card if exists, else under frontend pillar.',
    'add_decision → under backend pillar; link backend→decision.',
    'add_constraint → under product; link product→constraint.',
    'clarify → open-question near the feature that triggered ambiguity (F-xxx from context), else product.',
    'update_* on existing card → keep position; only body/title/status change in preview.',
  ],

  collisionRules: [
    'Run collision pass after placing each new preview card — nudge along radial direction until gap ≥ 48px.',
    'Do not nudge committed (non-preview) cards — only adjust new preview nodes.',
    'Max nudge iterations: 12; if still colliding, place further out on same radial line.',
  ],

  updateCardRules: [
    'update_feature / update_task with entity_id → match existing card by specRef.anchor or id; no reposition.',
    'If entity card does not exist yet on canvas, treat as create with placement rules above.',
    'Deleting on discard: remove only preview-added cards/edges from preview payload, not committed state.',
  ],

  examples: [
    {
      label: 'Add F-002 Google login (gp-03)',
      placement:
        'New feature card layer 1, parentCardId product, offset ~(0, 360) below F-001 cluster; edge product→F-002.',
    },
    {
      label: 'Add T-002 paired with F-002',
      placement:
        'Task card near F-002 if positioned, else frontend pillar; edge F-002→T-002 label "implements".',
    },
    {
      label: 'Clarify SSO domains (gp-06)',
      placement:
        'Open-question card offset (520, -40) from product; edge features→OQ-xxx label "raises".',
    },
    {
      label: 'User dragged T-001 then new preview',
      placement: 'T-001 stays at dragged coords; only new preview cards auto-layout.',
    },
  ],

  explicitNonGoals: [
    'No force-directed global re-layout of entire canvas on every preview.',
    'No auto-drill into detail layer — user clicks pillar to see new child cards.',
    'No z-index stacking rules in v0 — React Flow default.',
    'No minimap-specific placement — same coords as main canvas.',
  ],
}

/** Flatten brief for Agent mode or canvas mapper system prompt. */
export function formatCanvasPlacementRules(
  rules: CanvasPlacementRules = CANVAS_PLACEMENT_RULES,
): string {
  const anchorBlock = rules.defaultAnchors
    .map((a) => {
      const parent = a.parentCardId ? ` parent=${a.parentCardId}` : ''
      return (
        `- **${a.cardType}** layer ${a.layer}${parent} → (${a.defaultOffset.x}, ${a.defaultOffset.y})` +
        (a.notes ? ` — ${a.notes}` : '')
      )
    })
    .join('\n')

  const section = (title: string, lines: string[]) =>
    [`## ${title}`, ...lines.map((l) => `- ${l}`)].join('\n')

  const exampleBlock = rules.examples
    .map((ex) => `### ${ex.label}\n${ex.placement}`)
    .join('\n\n')

  return [
    '## Policy',
    rules.policy,
    '',
    section('Layer model', rules.layerModel),
    '',
    section('Preserve user drag', rules.preserveDrag),
    '',
    section('Auto-layout (preview-only)', rules.autoLayout),
    '',
    '## Default anchors',
    anchorBlock,
    '',
    section('New card rules', rules.newCardRules),
    '',
    section('Collision rules', rules.collisionRules),
    '',
    section('Update existing cards', rules.updateCardRules),
    '',
    '## Examples',
    exampleBlock,
    '',
    section('Explicit non-goals', rules.explicitNonGoals),
  ].join('\n')
}

export function getDefaultAnchor(
  cardType: CardType,
  rules: CanvasPlacementRules = CANVAS_PLACEMENT_RULES,
): PlacementAnchor | undefined {
  return rules.defaultAnchors.find((a) => a.cardType === cardType)
}
