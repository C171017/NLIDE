import { create } from 'zustand'
import type { Card, CanvasEdge, PreviewPayload } from '../types/canvas'
import {
  commitPreviewRemote,
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

  setChatDraft: (value: string) => void
  selectCard: (cardId: string | null) => void
  drillIntoCard: (cardId: string) => void
  drillOut: () => void
  updateCard: (cardId: string, patch: Partial<Pick<Card, 'title' | 'body'>>) => void
  moveCard: (cardId: string, position: { x: number; y: number }) => void
  submitChat: (message: string) => Promise<void>
  commitPreview: () => Promise<void>
  discardPreview: () => Promise<void>
}

function cloneCards(cards: Card[]): Card[] {
  return cards.map((card) => ({ ...card, position: { ...card.position } }))
}

function cloneEdges(edges: CanvasEdge[]): CanvasEdge[] {
  return edges.map((edge) => ({ ...edge }))
}

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

  setChatDraft: (value) => set({ chatDraft: value }),

  selectCard: (cardId) => set({ selectedCardId: cardId }),

  drillIntoCard: (cardId) => set({ drillFocusId: cardId, selectedCardId: cardId }),

  drillOut: () => set({ drillFocusId: null, selectedCardId: null }),

  updateCard: (cardId, patch) => {
    set((state) => ({
      committedCards: state.committedCards.map((card) =>
        card.id === cardId ? { ...card, ...patch } : card,
      ),
    }))

    void patchCardRemote(cardId, patch).catch((error) => {
      console.warn('patch-card sync failed (local state kept):', error)
    })
  },

  moveCard: (cardId, position) =>
    set((state) => ({
      committedCards: state.committedCards.map((card) =>
        card.id === cardId ? { ...card, position } : card,
      ),
    })),

  submitChat: async (message) => {
    const trimmed = message.trim()
    if (!trimmed) return

    set({ isTranslating: true, chatDraft: '' })

    try {
      const { committedCards, committedEdges, centerCardId } = get()
      const preview = await submitIntent(trimmed, {
        cards: committedCards,
        edges: committedEdges,
        centerCardId,
      })
      set({ preview, isTranslating: false })
    } catch (error) {
      console.error('submitChat failed:', error)
      set({ isTranslating: false, chatDraft: trimmed })
    }
  },

  commitPreview: async () => {
    const { preview } = get()
    if (!preview) return

    try {
      await commitPreviewRemote(preview.previewId)
      set({
        committedCards: cloneCards(preview.cards),
        committedEdges: cloneEdges(preview.edges),
        preview: null,
        selectedCardId: null,
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
