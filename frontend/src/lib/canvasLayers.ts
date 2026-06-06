import type { Card, CanvasEdge } from '../types/canvas'

/** Horizontal spread between top-layer pillars (Frontend · Product · Backend). */
export const TOP_LAYER_SPREAD = 520

export type CanvasViewMode = 'top' | 'detail'

export function isTopLayerCard(card: Card): boolean {
  return card.layer === 0
}

export function isDetailCardFor(card: Card, focusId: string): boolean {
  return card.layer === 1 && card.parentCardId === focusId
}

export function resolveViewMode(
  drillFocusId: string | null,
  cards: Card[],
): { mode: CanvasViewMode; focusId: string | null } {
  if (!drillFocusId) {
    return { mode: 'top', focusId: null }
  }

  const focusCard = cards.find((card) => card.id === drillFocusId)
  if (!focusCard || !isTopLayerCard(focusCard)) {
    return { mode: 'top', focusId: null }
  }

  return { mode: 'detail', focusId: drillFocusId }
}

export function filterVisibleCards(cards: Card[], mode: CanvasViewMode, focusId: string | null): Card[] {
  if (mode === 'top') {
    return cards.filter(isTopLayerCard)
  }

  if (!focusId) {
    return cards.filter(isTopLayerCard)
  }

  return cards.filter((card) => card.id === focusId || isDetailCardFor(card, focusId))
}

export function filterVisibleEdges(
  edges: CanvasEdge[],
  visibleCardIds: Set<string>,
  mode: CanvasViewMode,
  focusId: string | null,
): CanvasEdge[] {
  return edges.filter((edge) => {
    if (!visibleCardIds.has(edge.source) || !visibleCardIds.has(edge.target)) {
      return false
    }

    if (mode === 'top') {
      return true
    }

    if (!focusId) {
      return true
    }

    const connectsFocus =
      edge.source === focusId ||
      edge.target === focusId ||
      (visibleCardIds.has(edge.source) && visibleCardIds.has(edge.target))

    return connectsFocus
  })
}

export function focusLabel(cards: Card[], focusId: string | null): string {
  if (!focusId) return 'Overview'
  const card = cards.find((item) => item.id === focusId)
  return card ? `${card.title} detail` : 'Detail'
}
