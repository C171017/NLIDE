/**
 * Canvas mapper — Phase 5 implementation.
 * Applies router `canvas_ops[]` (or derived ops) to committed canvas → PreviewPayload.
 */

import type { CardType as PlacementCardType } from './canvasPlacementRules.ts'
import { CANVAS_PLACEMENT_RULES, getDefaultAnchor } from './canvasPlacementRules.ts'
import type {
  CanvasOp,
  CanvasOpCardType,
  CreateCardOp,
  LinkToOp,
  UpdateCardOp,
} from './canvasOpsMapping.ts'
import { getDefaultEdgeLabel } from './canvasOpsMapping.ts'
import type { CanvasCard, CanvasEdge, MdPatch, PreviewPayload } from './canvasTypes.ts'
import { diffPreview } from './diffPreview.ts'
import {
  allocateNextConstraintId,
  allocateNextDecisionId,
  allocateNextFeatureId,
  allocateNextOpenQuestionId,
  allocateNextTaskId,
} from './idAlloc.ts'
import type { RouterPlan } from './types.ts'

const NODE_WIDTH = 260
const NODE_HEIGHT = 150
const COLLISION_GAP = 48
const SIBLING_STACK_Y = 80

/** Temp v0 — translator-created entity cards appear on overview without pillar drill-in. */
export const OVERVIEW_ORPHAN_NEW_ENTITIES = true

const OVERVIEW_ORPHAN_Y = 340
const OVERVIEW_ORPHAN_X_START = -280
const OVERVIEW_ORPHAN_X_GAP = 300

const TOP_LAYER_PILLAR_IDS = new Set(['product', 'frontend', 'backend'])

function isOverviewOrphanEntityType(type: CanvasOpCardType): boolean {
  return (
    type === 'feature' ||
    type === 'task' ||
    type === 'decision' ||
    type === 'open-question' ||
    type === 'constraint'
  )
}

function placeOverviewOrphanEntity(cards: CanvasCard[], newCard: CanvasCard): void {
  const siblings = cards.filter(
    (card) =>
      card.id !== newCard.id &&
      card.layer === 0 &&
      !TOP_LAYER_PILLAR_IDS.has(card.id) &&
      isOverviewOrphanEntityType(card.type as CanvasOpCardType),
  )
  const index = siblings.length

  newCard.layer = 0
  newCard.parentCardId = undefined
  newCard.position = {
    x: OVERVIEW_ORPHAN_X_START + index * OVERVIEW_ORPHAN_X_GAP,
    y: OVERVIEW_ORPHAN_Y,
  }
}

export interface WriterEntityHint {
  entityId: string
  file: string
  action: 'add' | 'update' | 'remove'
  title?: string
  body?: string
  summary?: string
  linkedFeatureId?: string
}

export interface MapCanvasInput {
  committedCards: CanvasCard[]
  committedEdges: CanvasEdge[]
  centerCardId: string
  routerPlan: RouterPlan
  writerHints?: WriterEntityHint[]
  mdPatches?: MdPatch[]
  previewId?: string
  userMessage?: string
}

function cloneCards(cards: CanvasCard[]): CanvasCard[] {
  return cards.map((card) => ({
    ...card,
    position: { ...card.position },
    specRef: { ...card.specRef },
    vizPayload: card.vizPayload !== undefined ? structuredClone(card.vizPayload) : undefined,
  }))
}

function cloneEdges(edges: CanvasEdge[]): CanvasEdge[] {
  return edges.map((edge) => ({ ...edge }))
}

function parseCanvasOp(raw: Record<string, unknown>): CanvasOp | null {
  const action = raw.action
  if (action === 'create_card') {
    if (typeof raw.type !== 'string' || typeof raw.id !== 'string') return null
    return {
      action: 'create_card',
      type: raw.type as CanvasOpCardType,
      id: raw.id,
      link_to: typeof raw.link_to === 'string' ? raw.link_to : 'product',
      title: typeof raw.title === 'string' ? raw.title : undefined,
      body: typeof raw.body === 'string' ? raw.body : undefined,
      status:
        raw.status === 'proposed' ||
        raw.status === 'approved' ||
        raw.status === 'in_progress' ||
        raw.status === 'done'
          ? raw.status
          : undefined,
      edge_label: typeof raw.edge_label === 'string' ? raw.edge_label : undefined,
    }
  }

  if (action === 'link_to') {
    if (typeof raw.source !== 'string' || typeof raw.target !== 'string') return null
    return {
      action: 'link_to',
      source: raw.source,
      target: raw.target,
      label: typeof raw.label === 'string' ? raw.label : undefined,
    }
  }

  if (action === 'update_card') {
    if (typeof raw.id !== 'string') return null
    return {
      action: 'update_card',
      id: raw.id,
      title: typeof raw.title === 'string' ? raw.title : undefined,
      body: typeof raw.body === 'string' ? raw.body : undefined,
      status:
        raw.status === 'proposed' ||
        raw.status === 'approved' ||
        raw.status === 'in_progress' ||
        raw.status === 'done'
          ? raw.status
          : undefined,
    }
  }

  return null
}

function parseCanvasOps(rawOps: Record<string, unknown>[]): CanvasOp[] {
  return rawOps.flatMap((raw) => {
    const op = parseCanvasOp(raw)
    return op ? [op] : []
  })
}

function collectEntityIds(cards: CanvasCard[], prefix: string): string[] {
  const pattern = new RegExp(`^${prefix}-\\d{3}$`)
  const ids = new Set<string>()

  for (const card of cards) {
    if (pattern.test(card.id)) ids.add(card.id)
    if (card.specRef.anchor && pattern.test(card.specRef.anchor)) ids.add(card.specRef.anchor)
  }

  const featuresTable = cards.find((card) => card.id === 'features' && card.vizType === 'data-table')
  if (featuresTable?.vizPayload && prefix === 'F') {
    const payload = featuresTable.vizPayload as { rows?: string[][] }
    for (const row of payload.rows ?? []) {
      if (row[0] && pattern.test(row[0])) ids.add(row[0])
    }
  }

  return [...ids]
}

function findCard(cards: CanvasCard[], idOrAnchor: string): CanvasCard | undefined {
  return (
    cards.find((card) => card.id === idOrAnchor) ??
    cards.find((card) => card.specRef.anchor === idOrAnchor)
  )
}

function resolveLinkTarget(alias: string, centerCardId: string, cards: CanvasCard[]): string {
  if (alias === 'index' || alias === 'product') return centerCardId
  if (alias === 'features') return cards.some((card) => card.id === 'features') ? 'features' : centerCardId
  const resolved = findCard(cards, alias)
  return resolved?.id ?? alias
}

function cardTypeForFile(file: string): PlacementCardType | undefined {
  switch (file) {
    case 'features.md':
      return 'feature'
    case 'tasks.md':
      return 'task'
    case 'open-questions.md':
      return 'open-question'
    case 'constraints.md':
      return 'constraint'
    case 'decisions.md':
      return 'decision'
    case 'users.md':
      return 'users'
    case 'architecture.md':
      return 'architecture'
    case 'product.md':
      return 'product'
    default:
      return undefined
  }
}

function specFileForType(type: CanvasOpCardType): string {
  switch (type) {
    case 'feature':
      return 'features.md'
    case 'task':
      return 'tasks.md'
    case 'open-question':
      return 'open-questions.md'
    case 'constraint':
      return 'constraints.md'
    case 'decision':
      return 'decisions.md'
    case 'users':
      return 'users.md'
    case 'architecture':
      return 'architecture.md'
    case 'product':
      return 'product.md'
    case 'frontend':
    case 'backend':
      return 'architecture.md'
    default:
      return 'product.md'
  }
}

function hasAggregateFeaturesTable(cards: CanvasCard[]): boolean {
  return cards.some((card) => card.id === 'features' && card.vizType === 'data-table')
}

function hintForFile(hints: WriterEntityHint[], file: string): WriterEntityHint | undefined {
  return hints.find((hint) => hint.file === file)
}

function hintForEntity(hints: WriterEntityHint[], entityId: string): WriterEntityHint | undefined {
  return hints.find((hint) => hint.entityId === entityId)
}

function deriveUpdateCanvasOps(plan: RouterPlan, cards: CanvasCard[], hints: WriterEntityHint[]): CanvasOp[] {
  const ops: CanvasOp[] = []

  if (
    plan.intent_type === 'update_feature' ||
    plan.intent_type === 'update_task' ||
    plan.intent_type === 'update_product' ||
    plan.intent_type === 'update_architecture'
  ) {
    for (const operation of plan.operations) {
      if (operation.action !== 'update') continue
      const entityId = operation.entity_id ?? hintForFile(hints, operation.target)?.entityId
      if (!entityId) continue
      if (findCard(cards, entityId)) {
        ops.push({ action: 'update_card', id: entityId })
      }
    }
  }

  return ops
}

function deriveAddCanvasOps(
  plan: RouterPlan,
  cards: CanvasCard[],
  hints: WriterEntityHint[],
): CanvasOp[] {
  const ops: CanvasOp[] = []
  const featureIds = [...collectEntityIds(cards, 'F')]
  const taskIds = [...collectEntityIds(cards, 'T')]
  const oqIds = [...collectEntityIds(cards, 'OQ')]
  const decisionIds = [...collectEntityIds(cards, 'D')]
  const constraintIds = [...collectEntityIds(cards, 'C')]
  const useFeaturesTable = hasAggregateFeaturesTable(cards)
  let lastFeatureId: string | undefined

  for (const operation of plan.operations) {
    if (operation.action !== 'add') continue

    switch (operation.target) {
      case 'features.md': {
        const featureId =
          operation.entity_id ??
          hintForEntity(hints, operation.entity_id ?? '')?.entityId ??
          allocateNextFeatureId(featureIds)
        featureIds.push(featureId)
        lastFeatureId = featureId

        if (useFeaturesTable) break

        if (!findCard(cards, featureId) && !ops.some((op) => op.action === 'create_card' && op.id === featureId)) {
          ops.push({
            action: 'create_card',
            type: 'feature',
            id: featureId,
            link_to: 'product',
          })
        }
        break
      }
      case 'tasks.md': {
        const taskId =
          operation.entity_id ??
          hintForFile(hints, 'tasks.md')?.entityId ??
          allocateNextTaskId(taskIds)
        const linkedFeature =
          lastFeatureId ??
          hintForFile(hints, 'tasks.md')?.linkedFeatureId ??
          (featureIds.length ? featureIds[featureIds.length - 1] : undefined)
        ops.push({
          action: 'create_card',
          type: 'task',
          id: taskId,
          link_to: linkedFeature ?? 'frontend',
        })
        taskIds.push(taskId)
        break
      }
      case 'open-questions.md': {
        const oqId =
          operation.entity_id ??
          hintForFile(hints, 'open-questions.md')?.entityId ??
          allocateNextOpenQuestionId(oqIds)
        const linkTo = cards.some((card) => card.id === 'features') ? 'features' : 'product'
        ops.push({
          action: 'create_card',
          type: 'open-question',
          id: oqId,
          link_to: linkTo,
          edge_label: 'raises',
        })
        oqIds.push(oqId)
        break
      }
      case 'constraints.md': {
        const constraintId =
          operation.entity_id ??
          hintForFile(hints, 'constraints.md')?.entityId ??
          allocateNextConstraintId(constraintIds)
        ops.push({
          action: 'create_card',
          type: 'constraint',
          id: constraintId,
          link_to: 'product',
        })
        constraintIds.push(constraintId)
        break
      }
      case 'decisions.md': {
        const decisionId =
          operation.entity_id ??
          hintForFile(hints, 'decisions.md')?.entityId ??
          allocateNextDecisionId(decisionIds)
        ops.push({
          action: 'create_card',
          type: 'decision',
          id: decisionId,
          link_to: 'backend',
        })
        decisionIds.push(decisionId)
        break
      }
      default:
        break
    }
  }

  return ops
}

function deriveCanvasOps(
  plan: RouterPlan,
  cards: CanvasCard[],
  hints: WriterEntityHint[],
): CanvasOp[] {
  if (plan.canvas_ops.length > 0) {
    return parseCanvasOps(plan.canvas_ops)
  }

  const updateOps = deriveUpdateCanvasOps(plan, cards, hints)
  if (updateOps.length > 0) {
    return updateOps
  }

  return deriveAddCanvasOps(plan, cards, hints)
}

function defaultTitle(type: CanvasOpCardType, id: string, hint?: WriterEntityHint): string {
  if (hint?.title) return hint.title
  const label = type.replace('-', ' ')
  return `${id}: ${label}`
}

function defaultBody(type: CanvasOpCardType, plan: RouterPlan, hint?: WriterEntityHint, userMessage?: string): string {
  if (hint?.body) return hint.body
  if (userMessage && type === 'open-question') {
    return `From chat: "${userMessage}" — ${plan.open_questions[0] ?? plan.summary}`
  }
  return plan.summary
}

function placeNewCard(
  cards: CanvasCard[],
  newCard: CanvasCard,
  parentId: string | undefined,
  committedCardIds: Set<string>,
): void {
  const anchor = getDefaultAnchor(newCard.type as PlacementCardType)
  if (!anchor) return

  newCard.layer = anchor.layer
  if (anchor.parentCardId) newCard.parentCardId = anchor.parentCardId

  const siblings = cards.filter(
    (card) =>
      card.id !== newCard.id &&
      card.type === newCard.type &&
      card.parentCardId === newCard.parentCardId,
  )
  const siblingIndex = siblings.length

  let base = { ...anchor.defaultOffset }
  const parent = parentId ? findCard(cards, parentId) : undefined
  if (parent && anchor.layer === 1 && parent.id !== 'product') {
    base = {
      x: parent.position.x + anchor.defaultOffset.x * 0.35,
      y: parent.position.y + anchor.defaultOffset.y * 0.35,
    }
  }

  newCard.position = {
    x: base.x,
    y: base.y + siblingIndex * SIBLING_STACK_Y,
  }

  nudgeForCollisions(newCard, cards, committedCardIds)
}

function boxesOverlap(a: CanvasCard, b: CanvasCard, gap: number): boolean {
  const aLeft = a.position.x - gap / 2
  const aRight = a.position.x + NODE_WIDTH + gap / 2
  const aTop = a.position.y - gap / 2
  const aBottom = a.position.y + NODE_HEIGHT + gap / 2
  const bLeft = b.position.x - gap / 2
  const bRight = b.position.x + NODE_WIDTH + gap / 2
  const bTop = b.position.y - gap / 2
  const bBottom = b.position.y + NODE_HEIGHT + gap / 2

  return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop
}

function nudgeForCollisions(
  previewCard: CanvasCard,
  cards: CanvasCard[],
  committedCardIds: Set<string>,
): void {
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const blocker = cards.find(
      (card) =>
        card.id !== previewCard.id &&
        boxesOverlap(previewCard, card, COLLISION_GAP),
    )
    if (!blocker) break

    previewCard.position.y += SIBLING_STACK_Y

    if (!committedCardIds.has(blocker.id)) {
      blocker.position.y += SIBLING_STACK_Y / 2
    }
  }
}

function edgeIdFor(source: string, target: string, edges: CanvasEdge[]): string {
  const base = `e-${source}-${target}`
  if (!edges.some((edge) => edge.id === base)) return base
  return `e-preview-${source}-${target}-${edges.length}`
}

function defaultEdgeLabelFor(
  cards: CanvasCard[],
  sourceId: string,
  targetId: string,
  explicit?: string,
): string | undefined {
  if (explicit) return explicit
  const source = findCard(cards, sourceId)
  const target = findCard(cards, targetId)
  if (!source || !target) return undefined
  const fromType = source.type === 'product' ? 'product' : (source.type as CanvasOpCardType)
  return getDefaultEdgeLabel(fromType, target.type as CanvasOpCardType)
}

function applyCreateCard(
  op: CreateCardOp,
  cards: CanvasCard[],
  edges: CanvasEdge[],
  centerCardId: string,
  committedCardIds: Set<string>,
  plan: RouterPlan,
  hints: WriterEntityHint[],
  userMessage?: string,
): void {
  if (findCard(cards, op.id)) return

  const hint = hintForEntity(hints, op.id) ?? hintForFile(hints, specFileForType(op.type))
  const card: CanvasCard = {
    id: op.id,
    specRef: { file: specFileForType(op.type), anchor: op.id },
    type: op.type,
    title: op.title ?? defaultTitle(op.type, op.id, hint),
    body: op.body ?? defaultBody(op.type, plan, hint, userMessage),
    position: { x: 0, y: 0 },
    layer: 1,
    status: op.status ?? 'proposed',
  }

  const useOverviewOrphan =
    OVERVIEW_ORPHAN_NEW_ENTITIES &&
    isOverviewOrphanEntityType(op.type) &&
    !committedCardIds.has(op.id)

  if (useOverviewOrphan) {
    placeOverviewOrphanEntity(cards, card)
    cards.push(card)
    return
  }

  const linkTarget = resolveLinkTarget(op.link_to, centerCardId, cards)
  placeNewCard(cards, card, linkTarget, committedCardIds)
  cards.push(card)

  const label = defaultEdgeLabelFor(cards, linkTarget, op.id, op.edge_label)
  edges.push({
    id: edgeIdFor(linkTarget, op.id, edges),
    source: linkTarget,
    target: op.id,
    label,
  })
}

function applyLinkTo(
  op: LinkToOp,
  cards: CanvasCard[],
  edges: CanvasEdge[],
  centerCardId: string,
): void {
  const source = resolveLinkTarget(op.source, centerCardId, cards)
  const target = resolveLinkTarget(op.target, centerCardId, cards)
  if (!findCard(cards, source) || !findCard(cards, target)) return
  if (edges.some((edge) => edge.source === source && edge.target === target)) return

  edges.push({
    id: edgeIdFor(source, target, edges),
    source,
    target,
    label: op.label ?? defaultEdgeLabelFor(cards, source, target),
  })
}

function applyUpdateCard(op: UpdateCardOp, cards: CanvasCard[], hints: WriterEntityHint[]): void {
  const card = findCard(cards, op.id)
  if (!card) return
  const hint = hintForEntity(hints, op.id)

  if (op.title !== undefined) card.title = op.title
  else if (hint?.title) card.title = hint.title

  if (op.body !== undefined) card.body = op.body
  else if (hint?.body) card.body = hint.body

  if (op.status !== undefined) card.status = op.status
}

function applyFeaturesTableAdd(
  cards: CanvasCard[],
  featureId: string,
  title: string,
): boolean {
  const featuresCard = cards.find((card) => card.id === 'features' && card.vizType === 'data-table')
  if (!featuresCard?.vizPayload) return false

  const payload = featuresCard.vizPayload as { columns: string[]; rows: string[][] }
  if (payload.rows.some((row) => row[0] === featureId)) return false

  featuresCard.vizPayload = {
    ...payload,
    rows: [...payload.rows, [featureId, title, 'proposed', 'high']],
  }
  return true
}

function shouldTableAddFeature(
  plan: RouterPlan,
  ops: CanvasOp[],
  cards: CanvasCard[],
  featureId: string,
): boolean {
  if (!hasAggregateFeaturesTable(cards)) return false
  if (!plan.operations.some((op) => op.target === 'features.md' && op.action === 'add')) return false
  if (ops.some((op) => op.action === 'create_card' && op.type === 'feature' && op.id === featureId)) {
    return false
  }
  return true
}

function deriveMdPatches(
  plan: RouterPlan,
  hints: WriterEntityHint[],
  tableFeatureAdds: { entityId: string; title: string }[],
): MdPatch[] {
  if (hints.length > 0) {
    return hints.map((hint) => ({
      file: hint.file,
      action: hint.action,
      anchor: hint.entityId,
      summary: hint.summary ?? `${hint.action} ${hint.entityId}`,
    }))
  }

  const patches: MdPatch[] = []

  for (const operation of plan.operations) {
    const type = cardTypeForFile(operation.target)
    if (!type) continue

    const entityId = operation.entity_id
    const summary =
      operation.action === 'update' && entityId
        ? `Update ${entityId} in ${operation.target}`
        : `${operation.action === 'add' ? 'Add' : 'Update'} entry in ${operation.target}`

    patches.push({
      file: operation.target,
      action: operation.action === 'add' ? 'add' : 'update',
      anchor: entityId,
      summary,
    })
  }

  for (const row of tableFeatureAdds) {
    if (patches.some((patch) => patch.file === 'features.md' && patch.anchor === row.entityId)) continue
    patches.push({
      file: 'features.md',
      action: 'add',
      anchor: row.entityId,
      summary: `Propose ${row.entityId} ${row.title}`,
    })
  }

  return patches
}

function allocateFeatureIdForTable(cards: CanvasCard[]): string {
  return allocateNextFeatureId(collectEntityIds(cards, 'F'))
}

function pushUnique(list: string[], value: string | null | undefined): void {
  if (!value || list.includes(value)) return
  list.push(value)
}

function resolveActualCardId(cards: CanvasCard[], idOrAnchor: string): string | null {
  return findCard(cards, idOrAnchor)?.id ?? null
}

/** Map router plan + committed canvas → preview payload. */
export function mapCanvasToPreview(input: MapCanvasInput): PreviewPayload {
  const {
    committedCards,
    committedEdges,
    centerCardId,
    routerPlan,
    writerHints = [],
    previewId = `preview-${Date.now()}`,
    userMessage,
  } = input

  const cards = cloneCards(committedCards)
  const edges = cloneEdges(committedEdges)
  const committedCardIds = new Set(committedCards.map((card) => card.id))
  const hints = [...writerHints]
  const tableFeatureAdds: { entityId: string; title: string }[] = []

  const canvasOps = deriveCanvasOps(routerPlan, cards, hints)

  for (const operation of routerPlan.operations) {
    if (operation.target !== 'features.md' || operation.action !== 'add') continue
    if (!hasAggregateFeaturesTable(cards)) continue

    const featureId =
      operation.entity_id ??
      hintForFile(hints, 'features.md')?.entityId ??
      allocateFeatureIdForTable(cards)
    const title =
      hintForEntity(hints, featureId)?.title ??
      routerPlan.summary.replace(/\.$/, '') ??
      'New feature'
    if (shouldTableAddFeature(routerPlan, canvasOps, cards, featureId)) {
      applyFeaturesTableAdd(cards, featureId, title)
      tableFeatureAdds.push({ entityId: featureId, title })
    }
  }

  let focusCardId: string | null = null
  const orderedPreviewCardIds: string[] = []

  for (const op of canvasOps) {
    if (op.action === 'create_card') {
      applyCreateCard(op, cards, edges, centerCardId, committedCardIds, routerPlan, hints, userMessage)
      pushUnique(orderedPreviewCardIds, resolveActualCardId(cards, op.id))
      focusCardId = op.id
    } else if (op.action === 'link_to') {
      applyLinkTo(op, cards, edges, centerCardId)
    } else if (op.action === 'update_card') {
      applyUpdateCard(op, cards, hints)
      pushUnique(orderedPreviewCardIds, resolveActualCardId(cards, op.id))
    }
  }

  const mdPatches =
    input.mdPatches ?? deriveMdPatches(routerPlan, hints, tableFeatureAdds)
  const { previewCardIds } = diffPreview(committedCards, committedEdges, cards, edges)
  for (const card of cards) {
    if (previewCardIds.has(card.id)) {
      pushUnique(orderedPreviewCardIds, card.id)
    }
  }

  return {
    previewId,
    cards,
    edges,
    mdPatches,
    summary: routerPlan.summary,
    previewCardIds: orderedPreviewCardIds,
    focusCardId,
  }
}

/** Demo stub plan — deterministic multi-card preview for local development. */
export function buildStubPreviewPlan(message: string): RouterPlan {
  return {
    intent_type: 'add_feature',
    summary: 'Preview adds Google login, a dark mode toggle, and an open question about allowed domains.',
    operations: [
      { target: 'features.md', action: 'add', entity_id: 'F-901' },
      { target: 'features.md', action: 'add', entity_id: 'F-902' },
      { target: 'open-questions.md', action: 'add', entity_id: 'OQ-901' },
    ],
    canvas_ops: [
      {
        action: 'create_card',
        type: 'feature',
        id: 'F-901',
        link_to: 'product',
        edge_label: 'contains',
        title: 'F-901: Google login',
        body: 'Enterprise users can sign in with Google Workspace accounts.',
      },
      {
        action: 'create_card',
        type: 'feature',
        id: 'F-902',
        link_to: 'product',
        edge_label: 'contains',
        title: 'F-902: Dark mode toggle',
        body: 'Users can switch the canvas between light and dark display modes.',
      },
      {
        action: 'create_card',
        type: 'open-question',
        id: 'OQ-901',
        link_to: 'features',
        edge_label: 'raises',
        title: 'Open question (preview)',
        body: `From chat: "${message}" — which enterprise domains should be allowed for Google login?`,
      },
    ],
    open_questions: ['Which enterprise domains should be allowed for Google login?'],
  }
}

export { CANVAS_PLACEMENT_RULES }
