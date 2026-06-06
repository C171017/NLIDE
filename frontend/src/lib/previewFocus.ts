import { isTopLayerCard } from './canvasLayers'
import type { Card, PreviewPayload } from '../types/canvas'

/** First existing card targeted by an update patch (behavior-change previews). */
export function resolvePreviewFocusCardId(
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
