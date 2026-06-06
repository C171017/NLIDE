import { create } from 'zustand'
import type { Card, CanvasEdge, PreviewPayload } from '../types/canvas'
import { canDeleteCard } from '../lib/canDeleteCard'
import { isTopLayerCard } from '../lib/canvasLayers'
import {
  commitPreviewRemote,
  DEFAULT_PROJECT_ID,
  deleteCardRemote,
  discardPreviewRemote,
  patchCardRemote,
  submitIntent,
} from '../lib/api'
import { sampleCanvas, SAMPLE_PROJECT_NAME } from '../data/sampleProject'

interface CanvasStore {
  projectName: string
  committedCards: Card[]
  committedEdges: CanvasEdge[]
  centerCardId: string
  preview: PreviewPayload | null
  selectedCardId: string | null
  drillFocusId: string | null
  isTranslating: boolean
  chatDraft: string
  isDeleteMode: boolean

  setChatDraft: (value: string) => void
  enterDeleteMode: () => void
  exitDeleteMode: () => void
  deleteCard: (cardId: string) => boolean
  selectCard: (cardId: string | null) => void
  toggleSelectCard: (cardId: string) => void
  drillIntoCard: (cardId: string) => void
  drillOut: () => void
  drillTopLayerCard: (cardId: string) => void
  updateCard: (cardId: string, patch: Partial<Pick<Card, 'title' | 'body'>>) => void
  moveCard: (cardId: string, position: { x: number; y: number }) => void
  setCardPositions: (updates: Array<{ id: string; position: { x: number; y: number } }>) => void
  submitChat: (message: string) => Promise<void>
  cancelChat: () => void
  commitPreview: () => Promise<void>
  discardPreview: () => Promise<void>
}

function cloneCards(cards: Card[]): Card[] {
  return cards.map((card) => ({ ...card, position: { ...card.position } }))
}

function cloneEdges(edges: CanvasEdge[]): CanvasEdge[] {
  return edges.map((edge) => ({ ...edge }))
}

function removeCardFromCanvas(
  cardId: string,
  cards: Card[],
  edges: CanvasEdge[],
  centerCardId: string,
): { cards: Card[]; edges: CanvasEdge[] } | null {
  if (!canDeleteCard(cardId, centerCardId, cards)) {
    return null
  }

  return {
    cards: cards.filter((card) => card.id !== cardId),
    edges: edges.filter((edge) => edge.source !== cardId && edge.target !== cardId),
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

let chatAbortController: AbortController | null = null

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  projectName: SAMPLE_PROJECT_NAME,
  committedCards: cloneCards(sampleCanvas.cards),
  committedEdges: cloneEdges(sampleCanvas.edges),
  centerCardId: sampleCanvas.centerCardId,
  preview: null,
  selectedCardId: null,
  drillFocusId: null,
  isTranslating: false,
  chatDraft: '',
  isDeleteMode: false,

  setChatDraft: (value) => set({ chatDraft: value }),

  enterDeleteMode: () => set({ isDeleteMode: true, selectedCardId: null }),

  exitDeleteMode: () => set({ isDeleteMode: false }),

  deleteCard: (cardId) => {
    const { centerCardId, preview, selectedCardId, drillFocusId } = get()
    const sourceCards = preview?.cards ?? get().committedCards
    const sourceEdges = preview?.edges ?? get().committedEdges
    const next = removeCardFromCanvas(cardId, sourceCards, sourceEdges, centerCardId)

    if (!next) {
      return false
    }

    if (preview) {
      set({
        preview: {
          ...preview,
          cards: cloneCards(next.cards),
          edges: cloneEdges(next.edges),
        },
        selectedCardId: selectedCardId === cardId ? null : selectedCardId,
        drillFocusId: drillFocusId === cardId ? null : drillFocusId,
      })
    } else {
      set({
        committedCards: cloneCards(next.cards),
        committedEdges: cloneEdges(next.edges),
        selectedCardId: selectedCardId === cardId ? null : selectedCardId,
        drillFocusId: drillFocusId === cardId ? null : drillFocusId,
      })
    }

    void deleteCardRemote(cardId).catch((error) => {
      console.warn('delete-card sync failed (local state kept):', error)
    })

    return true
  },

  selectCard: (cardId) => set({ selectedCardId: cardId }),

  toggleSelectCard: (cardId) => {
    const { selectedCardId } = get()
    set({ selectedCardId: selectedCardId === cardId ? null : cardId })
  },

  drillIntoCard: (cardId) => set({ drillFocusId: cardId, selectedCardId: cardId }),

  drillOut: () => set({ drillFocusId: null, selectedCardId: null }),

  drillTopLayerCard: (cardId) => {
    const { drillFocusId, committedCards, preview } = get()
    const cards = preview?.cards ?? committedCards
    const card = cards.find((item) => item.id === cardId)
    if (!card || !isTopLayerCard(card)) return

    if (drillFocusId === cardId) {
      get().drillOut()
    } else {
      get().drillIntoCard(cardId)
    }
  },

  updateCard: (cardId, patch) => {
    set((state) => {
      if (state.preview) {
        return {
          preview: {
            ...state.preview,
            cards: state.preview.cards.map((card) =>
              card.id === cardId ? { ...card, ...patch } : card,
            ),
          },
        }
      }

      return {
        committedCards: state.committedCards.map((card) =>
          card.id === cardId ? { ...card, ...patch } : card,
        ),
      }
    })

    void patchCardRemote(cardId, patch).catch((error) => {
      console.warn('patch-card sync failed (local state kept):', error)
    })
  },

  moveCard: (cardId, position) => {
    set((state) => {
      if (state.preview) {
        return {
          preview: {
            ...state.preview,
            cards: state.preview.cards.map((card) =>
              card.id === cardId ? { ...card, position } : card,
            ),
          },
        }
      }

      return {
        committedCards: state.committedCards.map((card) =>
          card.id === cardId ? { ...card, position } : card,
        ),
      }
    })
  },

  setCardPositions: (updates) => {
    const positionById = new Map(updates.map((update) => [update.id, update.position]))

    set((state) => {
      const mapCards = (cards: Card[]) =>
        cards.map((card) =>
          positionById.has(card.id)
            ? { ...card, position: positionById.get(card.id)! }
            : card,
        )

      if (state.preview) {
        return {
          preview: {
            ...state.preview,
            cards: mapCards(state.preview.cards),
          },
        }
      }

      return { committedCards: mapCards(state.committedCards) }
    })
  },

  submitChat: async (message) => {
    const trimmed = message.trim()
    if (!trimmed || get().isTranslating) return

    chatAbortController?.abort()
    const controller = new AbortController()
    chatAbortController = controller

    set({ isTranslating: true, chatDraft: '' })

    try {
      const { committedCards, committedEdges, centerCardId } = get()
      const preview = await submitIntent(
        trimmed,
        {
          cards: committedCards,
          edges: committedEdges,
          centerCardId,
        },
        DEFAULT_PROJECT_ID,
        controller.signal,
      )
      if (chatAbortController !== controller) return
      set({ preview, isTranslating: false })
    } catch (error) {
      if (chatAbortController !== controller) return
      if (isAbortError(error)) {
        set({ isTranslating: false, chatDraft: trimmed })
        return
      }
      console.error('submitChat failed:', error)
      set({ isTranslating: false, chatDraft: trimmed })
    } finally {
      if (chatAbortController === controller) {
        chatAbortController = null
      }
    }
  },

  cancelChat: () => {
    chatAbortController?.abort()
  },

  commitPreview: async () => {
    const { preview, committedCards } = get()
    if (!preview) return

    const committedIds = new Set(committedCards.map((card) => card.id))
    const newEntityIds = preview.cards
      .filter(
        (card) =>
          !committedIds.has(card.id) &&
          card.layer === 0 &&
          !['product', 'frontend', 'backend'].includes(card.id),
      )
      .map((card) => card.id)

    try {
      await commitPreviewRemote(preview.previewId)
      set({
        committedCards: cloneCards(preview.cards),
        committedEdges: cloneEdges(preview.edges),
        preview: null,
        selectedCardId: newEntityIds[0] ?? null,
        drillFocusId: null,
      })
    } catch (error) {
      console.error('commitPreview failed:', error)
    }
  },

  discardPreview: async () => {
    const { preview } = get()
    if (!preview) {
      set({ preview: null, selectedCardId: null, drillFocusId: null })
      return
    }

    try {
      await discardPreviewRemote(preview.previewId)
      set({ preview: null, selectedCardId: null, drillFocusId: null })
    } catch (error) {
      console.error('discardPreview failed:', error)
    }
  },
}))
