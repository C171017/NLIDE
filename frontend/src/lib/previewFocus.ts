import { isTopLayerCard } from './canvasLayers'
import { diffPreview } from '@nlide/shared/diffPreview'
import type { CanvasEdge, Card, PreviewPayload } from '../types/canvas'

/** First existing card targeted by an update patch (behavior-change previews). */
function resolveUpdateFocusCardId(
  preview: PreviewPayload,
  committedCards: Card[],
): string | null {
  const committedIds = new Set(committedCards.map((card) => card.id))

  for (const patch of preview.mdPatches) {
    if (patch.action !== 'update' || !patch.anchor) continue
    if (committedIds.has(patch.anchor)) {
      return patch.anchor
    }
  }

  for (const card of preview.cards) {
    if (!committedIds.has(card.id)) continue
    const committed = committedCards.find((item) => item.id === card.id)
    if (committed && card.body !== committed.body) {
      return card.id
    }
  }

  return null
}

/** Last new card in preview — used when compound turns create multiple cards. */
function resolveLastNewCardId(
  preview: PreviewPayload,
  committedCards: Card[],
): string | null {
  if (preview.focusCardId) {
    return preview.focusCardId
  }

  const committedIds = new Set(committedCards.map((card) => card.id))
  const newCards = preview.cards.filter((card) => !committedIds.has(card.id))
  if (newCards.length === 0) {
    return null
  }

  return newCards[newCards.length - 1]?.id ?? null
}

export function resolvePreviewFocusCardId(
  preview: PreviewPayload,
  committedCards: Card[],
  committedEdges: CanvasEdge[] = [],
): string | null {
  const [firstQueuedCardId] = resolvePreviewCardQueueIds(preview, committedCards, committedEdges)
  if (firstQueuedCardId) {
    return firstQueuedCardId
  }

  const updateFocus = resolveUpdateFocusCardId(preview, committedCards)
  if (updateFocus) {
    return updateFocus
  }

  return resolveLastNewCardId(preview, committedCards)
}

export function resolvePreviewCardQueueIds(
  preview: PreviewPayload,
  committedCards: Card[],
  committedEdges: CanvasEdge[] = [],
): string[] {
  const previewCardsById = new Map(preview.cards.map((card) => [card.id, card]))
  const orderedIds: string[] = []

  for (const cardId of preview.previewCardIds ?? []) {
    if (!previewCardsById.has(cardId) || orderedIds.includes(cardId)) continue
    orderedIds.push(cardId)
  }

  if (orderedIds.length > 0) {
    return orderedIds
  }

  const { previewCardIds } = diffPreview(committedCards, committedEdges, preview.cards, preview.edges)
  return preview.cards
    .filter((card) => previewCardIds.has(card.id))
    .map((card) => card.id)
}

export function resolveCurrentPreviewCardId(
  preview: PreviewPayload,
  committedCards: Card[],
  committedEdges: CanvasEdge[],
  previewQueueIndex: number,
): string | null {
  const queue = resolvePreviewCardQueueIds(preview, committedCards, committedEdges)
  return queue[previewQueueIndex] ?? null
}

/** Drill into parent pillar when the focus card lives on the detail layer. */
export function resolveDrillFocusForCard(
  card: Card | undefined,
  cards: Card[],
): string | null {
  if (!card || card.layer !== 1 || !card.parentCardId) {
    return null
  }

  const parent = cards.find((item) => item.id === card.parentCardId)
  if (parent && isTopLayerCard(parent)) {
    return parent.id
  }

  return null
}

/** Canvas layer state needed to reveal the focus card. */
export function resolveViewStateForFocusCard(
  card: Card | undefined,
  cards: Card[],
): { drillFocusId: string | null } {
  if (!card) {
    return { drillFocusId: null }
  }

  const drillInto = resolveDrillFocusForCard(card, cards)
  if (drillInto) {
    return { drillFocusId: drillInto }
  }

  if (isTopLayerCard(card)) {
    return { drillFocusId: null }
  }

  return { drillFocusId: null }
}

/** Card to select after batch commit — follows the preview queue, then falls back to overview entities. */
export function resolveCommitSelectionCardId(
  preview: PreviewPayload,
  committedCards: Card[],
): string | null {
  const focusCardId = resolvePreviewFocusCardId(preview, committedCards)
  if (focusCardId) {
    return focusCardId
  }

  const committedIds = new Set(committedCards.map((card) => card.id))
  const newEntityIds = preview.cards
    .filter(
      (card) =>
        !committedIds.has(card.id) &&
        card.layer === 0 &&
        !['product', 'frontend', 'backend'].includes(card.id),
    )
    .map((card) => card.id)

  return newEntityIds[newEntityIds.length - 1] ?? null
}
