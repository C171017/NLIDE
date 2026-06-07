import { create } from 'zustand'
import type { Card, CanvasEdge, PreviewPayload } from '../types/canvas'
import { canDeleteCard } from '../lib/canDeleteCard'
import { isTopLayerCard } from '../lib/canvasLayers'
import {
  commitPreviewCardRemote,
  commitPreviewRemote,
  deleteCardRemote,
  deleteEdgeRemote,
  discardPreviewCardRemote,
  discardPreviewRemote,
  patchCardRemote,
  submitIntent,
  type ProjectPayload,
} from '../lib/api'
import { syncLocalProjectCanvas } from '../lib/localProjects'
import {
  resolvePreviewCardQueueIds,
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
  previewQueueIndex: number
  previewFocusCardId: string | null
  exportedSpecCache: Record<string, string> | null
  selectedCardId: string | null
  selectedEdgeId: string | null
  drillFocusId: string | null
  isTranslating: boolean
  chatDraft: string
  isDeleteMode: boolean
  isPreviewActionPending: boolean
  previewActionError: string | null

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
  commitPreviewCard: () => Promise<void>
  discardPreviewCard: () => Promise<void>
  clearPreviewFocus: () => void
}

function cloneCards(cards: Card[]): Card[] {
  return cards.map((card) => ({ ...card, position: { ...card.position } }))
}

function cloneEdges(edges: CanvasEdge[]): CanvasEdge[] {
  return edges.map((edge) => ({ ...edge }))
}

function uniqueIds(ids: string[]): string[] {
  return ids.filter((id, index) => ids.indexOf(id) === index)
}

function orderedPreviewCardIds(
  preview: PreviewPayload,
  committedCards: Card[],
  committedEdges: CanvasEdge[],
): string[] {
  if (preview.previewCardIds?.length) {
    return uniqueIds(preview.previewCardIds)
  }

  return resolvePreviewCardQueueIds(preview, committedCards, committedEdges)
}

function resolveQueuedPreviewCard(
  preview: PreviewPayload,
  committedCards: Card[],
  committedEdges: CanvasEdge[],
  queueIndex: number,
): { cardId: string; queueIndex: number; queueLength: number } | null {
  const queue = orderedPreviewCardIds(preview, committedCards, committedEdges)
  const previewCardIds = new Set(preview.cards.map((card) => card.id))

  for (let index = Math.max(queueIndex, 0); index < queue.length; index += 1) {
    const cardId = queue[index]
    if (previewCardIds.has(cardId)) {
      return { cardId, queueIndex: index, queueLength: queue.length }
    }
  }

  return null
}

function upsertCard(cards: Card[], nextCard: Card): Card[] {
  if (cards.some((card) => card.id === nextCard.id)) {
    return cards.map((card) => (card.id === nextCard.id ? { ...nextCard } : card))
  }

  return [...cards, { ...nextCard }]
}

function commitCardLocally(
  preview: PreviewPayload,
  committedCards: Card[],
  committedEdges: CanvasEdge[],
  cardId: string,
): { committedCards: Card[]; committedEdges: CanvasEdge[] } {
  const card = preview.cards.find((item) => item.id === cardId)
  if (!card) {
    return { committedCards, committedEdges }
  }

  const nextCards = upsertCard(committedCards, card)
  const nextCardIds = new Set(nextCards.map((item) => item.id))
  const edgeMap = new Map(committedEdges.map((edge) => [edge.id, { ...edge }]))

  for (const edge of preview.edges) {
    if (edge.source !== cardId && edge.target !== cardId) continue
    if (!nextCardIds.has(edge.source) || !nextCardIds.has(edge.target)) continue
    edgeMap.set(edge.id, { ...edge })
  }

  return {
    committedCards: cloneCards(nextCards),
    committedEdges: cloneEdges([...edgeMap.values()]),
  }
}

function isPatchRelatedToCard(patch: PreviewPayload['mdPatches'][number], card: Card): boolean {
  const anchor = card.specRef.anchor ?? card.id
  if (patch.anchor && (patch.anchor === card.id || patch.anchor === anchor)) {
    return true
  }

  if (!patch.anchor && patch.file === card.specRef.file) {
    return true
  }

  if (card.vizType === 'data-table' && patch.file === card.specRef.file) {
    return true
  }

  return false
}

function removeRelatedMdPatches(preview: PreviewPayload, cardId: string): PreviewPayload {
  const card = preview.cards.find((item) => item.id === cardId)
  if (!card) return preview

  return {
    ...preview,
    mdPatches: preview.mdPatches.filter((patch) => !isPatchRelatedToCard(patch, card)),
  }
}

function discardCardLocally(
  preview: PreviewPayload,
  committedCards: Card[],
  cardId: string,
): PreviewPayload {
  const committedCard = committedCards.find((card) => card.id === cardId)
  const nextPreview = removeRelatedMdPatches(preview, cardId)

  if (committedCard) {
    return {
      ...nextPreview,
      cards: nextPreview.cards.map((card) => (card.id === cardId ? { ...committedCard } : card)),
    }
  }

  return {
    ...nextPreview,
    cards: nextPreview.cards.filter((card) => card.id !== cardId),
    edges: nextPreview.edges.filter((edge) => edge.source !== cardId && edge.target !== cardId),
  }
}

function resolveViewStateForCardId(cardId: string | null, cards: Card[]) {
  const card = cardId ? cards.find((item) => item.id === cardId) : undefined
  return resolveViewStateForFocusCard(card, cards)
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
  if (!state.projectId) return

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
  previewQueueIndex: 0,
  previewFocusCardId: null,
  exportedSpecCache: null,
  selectedCardId: null,
  selectedEdgeId: null,
  drillFocusId: null,
  isTranslating: false,
  chatDraft: '',
  isDeleteMode: false,
  isPreviewActionPending: false,
  previewActionError: null,

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
      isPreviewActionPending: false,
      previewActionError: null,
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

      const focusCardId = resolvePreviewFocusCardId(preview, committedCards, committedEdges)
      const focusCard = focusCardId
        ? preview.cards.find((card) => card.id === focusCardId)
        : undefined
      const viewState = resolveViewStateForFocusCard(focusCard, preview.cards)

      set({
        preview,
        previewQueueIndex: 0,
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

  commitPreviewCard: async () => {
    const { preview, committedCards, committedEdges, previewQueueIndex } = get()
    if (!preview || get().isPreviewActionPending) return

    const current = resolveQueuedPreviewCard(
      preview,
      committedCards,
      committedEdges,
      previewQueueIndex,
    )
    if (!current) {
      set({ preview: null, previewQueueIndex: 0, previewFocusCardId: null, selectedCardId: null, drillFocusId: null })
      return
    }

    set({ isPreviewActionPending: true, previewActionError: null })

    try {
      const result = await commitPreviewCardRemote(
        preview.previewId,
        current.cardId,
        activeProjectId(get),
      )
      const nextCommitted = commitCardLocally(preview, committedCards, committedEdges, current.cardId)
      const nextPreview = result.preview === undefined
        ? removeRelatedMdPatches(preview, current.cardId)
        : result.preview
      const nextQueueIndex = current.queueIndex + 1

      if (!nextPreview || nextQueueIndex >= current.queueLength) {
        set({
          committedCards: nextCommitted.committedCards,
          committedEdges: nextCommitted.committedEdges,
          preview: null,
          previewQueueIndex: 0,
          previewFocusCardId: null,
          exportedSpecCache: result.exportedSpec ?? get().exportedSpecCache,
          selectedCardId: current.cardId,
          drillFocusId: null,
          isPreviewActionPending: false,
          previewActionError: null,
        })
        syncLocalIfNeeded(get())
        return
      }

      const next = resolveQueuedPreviewCard(
        nextPreview,
        nextCommitted.committedCards,
        nextCommitted.committedEdges,
        nextQueueIndex,
      )
      if (!next) {
        set({
          committedCards: nextCommitted.committedCards,
          committedEdges: nextCommitted.committedEdges,
          preview: null,
          previewQueueIndex: 0,
          previewFocusCardId: null,
          exportedSpecCache: result.exportedSpec ?? get().exportedSpecCache,
          selectedCardId: current.cardId,
          drillFocusId: null,
          isPreviewActionPending: false,
          previewActionError: null,
        })
        syncLocalIfNeeded(get())
        return
      }

      const nextCardId = next?.cardId ?? null
      const viewState = resolveViewStateForCardId(nextCardId, nextPreview.cards)

      set({
        committedCards: nextCommitted.committedCards,
        committedEdges: nextCommitted.committedEdges,
        preview: nextPreview,
        previewQueueIndex: next?.queueIndex ?? nextQueueIndex,
        previewFocusCardId: nextCardId,
        exportedSpecCache: result.exportedSpec ?? get().exportedSpecCache,
        selectedCardId: nextCardId,
        drillFocusId: nextCardId ? viewState.drillFocusId : null,
        isPreviewActionPending: false,
        previewActionError: null,
      })
      syncLocalIfNeeded(get())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Commit failed'
      console.error('commitPreviewCard failed:', error)
      set({ isPreviewActionPending: false, previewActionError: message })
    }
  },

  discardPreviewCard: async () => {
    const { preview, committedCards, committedEdges, previewQueueIndex } = get()
    if (get().isPreviewActionPending) return
    if (!preview) {
      set({ preview: null, previewQueueIndex: 0, previewFocusCardId: null, selectedCardId: null, drillFocusId: null })
      return
    }

    const current = resolveQueuedPreviewCard(
      preview,
      committedCards,
      committedEdges,
      previewQueueIndex,
    )
    if (!current) {
      set({ preview: null, previewQueueIndex: 0, previewFocusCardId: null, selectedCardId: null, drillFocusId: null })
      return
    }

    set({ isPreviewActionPending: true, previewActionError: null })

    try {
      const result = await discardPreviewCardRemote(
        preview.previewId,
        current.cardId,
        activeProjectId(get),
      )
      const localPreview = discardCardLocally(preview, committedCards, current.cardId)
      const nextPreview = result.preview === undefined ? localPreview : result.preview
      const nextQueueIndex = current.queueIndex + 1

      if (!nextPreview || nextQueueIndex >= current.queueLength) {
        set({
          preview: null,
          previewQueueIndex: 0,
          previewFocusCardId: null,
          selectedCardId: null,
          drillFocusId: null,
          isPreviewActionPending: false,
          previewActionError: null,
        })
        return
      }

      const next = resolveQueuedPreviewCard(nextPreview, committedCards, committedEdges, nextQueueIndex)
      if (!next) {
        set({
          preview: null,
          previewQueueIndex: 0,
          previewFocusCardId: null,
          selectedCardId: null,
          drillFocusId: null,
          isPreviewActionPending: false,
          previewActionError: null,
        })
        return
      }

      const nextCardId = next?.cardId ?? null
      const viewState = resolveViewStateForCardId(nextCardId, nextPreview.cards)

      set({
        preview: nextPreview,
        previewQueueIndex: next?.queueIndex ?? nextQueueIndex,
        previewFocusCardId: nextCardId,
        selectedCardId: nextCardId,
        drillFocusId: nextCardId ? viewState.drillFocusId : null,
        isPreviewActionPending: false,
        previewActionError: null,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Discard failed'
      console.error('discardPreviewCard failed:', error)
      set({ isPreviewActionPending: false, previewActionError: message })
    }
  },

  commitPreview: async () => {
    const { preview, committedCards } = get()
    if (!preview) return

    try {
      const result = await commitPreviewRemote(preview.previewId, activeProjectId(get))
      set({
        committedCards: cloneCards(preview.cards),
        committedEdges: cloneEdges(preview.edges),
        preview: null,
        previewQueueIndex: 0,
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
      set({ preview: null, previewQueueIndex: 0, previewFocusCardId: null, selectedCardId: null, drillFocusId: null })
      return
    }

    try {
      await discardPreviewRemote(preview.previewId, activeProjectId(get))
      set({ preview: null, previewQueueIndex: 0, previewFocusCardId: null, selectedCardId: null, drillFocusId: null })
    } catch (error) {
      console.error('discardPreview failed:', error)
    }
  },
}))
