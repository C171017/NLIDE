import type { Card } from '../types/canvas'
import { isTopLayerCard } from './canvasLayers'

export function canDeleteCard(cardId: string, centerCardId: string, cards: Card[]): boolean {
  if (cardId === centerCardId) return false

  const card = cards.find((item) => item.id === cardId)
  if (!card) return false

  return !isTopLayerCard(card)
}

export function cardJiggleDelay(cardId: string): number {
  let hash = 0
  for (let index = 0; index < cardId.length; index += 1) {
    hash = (hash + cardId.charCodeAt(index) * (index + 1)) % 100
  }

  return hash * 3
}
