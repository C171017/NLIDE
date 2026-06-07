import { create } from 'zustand'
import type { Card, CanvasEdge, PreviewPayload } from '../types/canvas'
import { canDeleteCard } from '../lib/canDeleteCard'
import { isTopLayerCard } from '../lib/canvasLayers'
import {
  commitPreviewRemote,
  deleteCardRemote,
  deleteEdgeRemote,
  discardPreviewRemote,
  isInsForgeConfigured,
  patchCardRemote,
  submitIntent,
  type ProjectPayload,
} from '../lib/api'
import { syncLocalProjectCanvas } from '../lib/localProjects'
import {
  resolvePreviewFocusCardId,
  resolveViewStateForFocusCard,
  resolveCommitSelectionCardId,
} from '../lib/previewFocus'

interface CanvasStore {
  projectId: string | null
  projectName: string
  committedCards: Card[]
  committedEdges: CanvasEdge[]
  centerCardId: string
  preview: PreviewPayload | null
  previewFocusCardId: string | null
  exportedSpecCache: Record<string, string> | null
  selectedCardId: string | null
  selectedEdgeId: string | null
  drillFocusId: string | null
  isTranslating: boolean
  chatDraft: string
  isDeleteMode: boolean

  loadProject: (payload: ProjectPayload) => void
  setProjectName: (name: string) => void
  setChatDraft: (value: string) => void
  enterDeleteMode: () => void
  exitDeleteMode: () => void
  deleteCard: (cardId: string) => boolean
  deleteEdge: (edgeId: string) => boolean
  selectCard: (cardId: string | null) => void
  toggleSelectCard: (cardId: string) => void
  selectEdge: (edgeId: string | null) => void
  toggleSelectEdge: (edgeId: string) => void
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
  clearPreviewFocus: () => void
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

function syncLocalIfNeeded(state: {
  projectId: string | null
  projectName: string
  centerCardId: string
  committedCards: Card[]
  committedEdges: CanvasEdge[]
}) {
  if (!state.projectId || isInsForgeConfigured()) return

  syncLocalProjectCanvas(state.projectId, {
    projectName: state.projectName,
    centerCardId: state.centerCardId,
    cards: state.committedCards,
    edges: state.committedEdges,
  })
}

function activeProjectId(get: () => CanvasStore): string {
  const { projectId } = get()
  if (!projectId) {
    throw new Error('No active project')
  }
  return projectId
}

let chatAbortController: AbortController | null = null

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  projectId: null,
  projectName: '',
  committedCards: [],
  committedEdges: [],
  centerCardId: 'product',
  preview: null,
  previewFocusCardId: null,
  exportedSpecCache: null,
  selectedCardId: null,
  selectedEdgeId: null,
  drillFocusId: null,
  isTranslating: false,
  chatDraft: '',
  isDeleteMode: false,

  loadProject: (payload) =>
    set({
      projectId: payload.projectId,
      projectName: payload.projectName,
      committedCards: cloneCards(payload.cards),
      committedEdges: cloneEdges(payload.edges),
      centerCardId: payload.centerCardId,
      preview: null,
      previewFocusCardId: null,
      exportedSpecCache: null,
      selectedCardId: null,
      selectedEdgeId: null,
      drillFocusId: null,
      isTranslating: false,
      chatDraft: '',
      isDeleteMode: false,
    }),

  setProjectName: (name) => set({ projectName: name }),

  setChatDraft: (value) => set({ chatDraft: value }),

  enterDeleteMode: () => set({ isDeleteMode: true, selectedCardId: null, selectedEdgeId: null }),

  exitDeleteMode: () => set({ isDeleteMode: false, selectedEdgeId: null }),

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

    void deleteCardRemote(cardId, activeProjectId(get)).catch((error) => {
      console.warn('delete-card sync failed (local state kept):', error)
    })

    return true
  },

  deleteEdge: (edgeId) => {
    const { preview, selectedEdgeId } = get()
    const sourceEdges = preview?.edges ?? get().committedEdges

    if (!sourceEdges.some((edge) => edge.id === edgeId)) {
      return false
    }

    const nextEdges = sourceEdges.filter((edge) => edge.id !== edgeId)

    if (preview) {
      set({
        preview: {
          ...preview,
          edges: cloneEdges(nextEdges),
        },
        selectedEdgeId: selectedEdgeId === edgeId ? null : selectedEdgeId,
      })
    } else {
      set({
        committedEdges: cloneEdges(nextEdges),
        selectedEdgeId: selectedEdgeId === edgeId ? null : selectedEdgeId,
      })
    }

    void deleteEdgeRemote(edgeId, activeProjectId(get)).catch((error) => {
      console.warn('delete-edge sync failed (local state kept):', error)
    })

    return true
  },

  selectCard: (cardId) => set({ selectedCardId: cardId, selectedEdgeId: null }),

  toggleSelectCard: (cardId) => {
    const { selectedCardId } = get()
    set({
      selectedCardId: selectedCardId === cardId ? null : cardId,
      selectedEdgeId: null,
    })
  },

  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedCardId: null }),

  toggleSelectEdge: (edgeId) => {
    const { selectedEdgeId } = get()
    set({
      selectedEdgeId: selectedEdgeId === edgeId ? null : edgeId,
      selectedCardId: null,
    })
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

    void patchCardRemote(cardId, patch, activeProjectId(get)).catch((error) => {
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
        activeProjectId(get),
        controller.signal,
      )
      if (chatAbortController !== controller) return

      const focusCardId = resolvePreviewFocusCardId(preview, committedCards)
      const focusCard = focusCardId
        ? preview.cards.find((card) => card.id === focusCardId)
        : undefined
      const viewState = resolveViewStateForFocusCard(focusCard, preview.cards)

      set({
        preview,
        isTranslating: false,
        selectedCardId: focusCardId,
        previewFocusCardId: focusCardId,
        drillFocusId: focusCardId ? viewState.drillFocusId : get().drillFocusId,
      })
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

  clearPreviewFocus: () => set({ previewFocusCardId: null }),

  commitPreview: async () => {
    const { preview, committedCards } = get()
    if (!preview) return

    try {
      const result = await commitPreviewRemote(preview.previewId, activeProjectId(get))
      set({
        committedCards: cloneCards(preview.cards),
        committedEdges: cloneEdges(preview.edges),
        preview: null,
        previewFocusCardId: null,
        exportedSpecCache: result.exportedSpec ?? null,
        selectedCardId: resolveCommitSelectionCardId(preview, committedCards) ?? get().selectedCardId,
        drillFocusId: null,
      })
      syncLocalIfNeeded(get())
    } catch (error) {
      console.error('commitPreview failed:', error)
    }
  },

  discardPreview: async () => {
    const { preview } = get()
    if (!preview) {
      set({ preview: null, previewFocusCardId: null, selectedCardId: null, drillFocusId: null })
      return
    }

    try {
      await discardPreviewRemote(preview.previewId, activeProjectId(get))
      set({ preview: null, previewFocusCardId: null, selectedCardId: null, drillFocusId: null })
    } catch (error) {
      console.error('discardPreview failed:', error)
    }
  },
}))
