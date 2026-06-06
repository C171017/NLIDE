import type { Card, CanvasEdge } from '../types/canvas'

/** Zoom at or above this level reveals detail-layer cards for the selected top card. */
export const ZOOM_DETAIL_THRESHOLD = 0.5

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
  zoom: number,
  selectedCardId: string | null,
  cards: Card[],
): { mode: CanvasViewMode; focusId: string | null } {
  if (zoom < ZOOM_DETAIL_THRESHOLD || !selectedCardId) {
    return { mode: 'top', focusId: null }
  }

  const selected = cards.find((card) => card.id === selectedCardId)
  if (!selected) {
    return { mode: 'top', focusId: null }
  }

  if (isTopLayerCard(selected)) {
    return { mode: 'detail', focusId: selected.id }
  }

  const parentId = selected.parentCardId
  if (parentId) {
    return { mode: 'detail', focusId: parentId }
  }

  return { mode: 'top', focusId: null }
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
