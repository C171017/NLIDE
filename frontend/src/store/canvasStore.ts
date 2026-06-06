import { create } from 'zustand'
import type { Card, CanvasEdge, PreviewPayload } from '../types/canvas'
import { sampleCanvas, SAMPLE_PROJECT_NAME } from '../data/sampleProject'

interface CanvasStore {
  projectName: string
  committedCards: Card[]
  committedEdges: CanvasEdge[]
  centerCardId: string
  preview: PreviewPayload | null
  selectedCardId: string | null
  isTranslating: boolean
  chatDraft: string

  setChatDraft: (value: string) => void
  selectCard: (cardId: string | null) => void
  updateCard: (cardId: string, patch: Partial<Pick<Card, 'title' | 'body'>>) => void
  moveCard: (cardId: string, position: { x: number; y: number }) => void
  submitChat: (message: string) => Promise<void>
  commitPreview: () => void
  discardPreview: () => void
}

function cloneCards(cards: Card[]): Card[] {
  return cards.map((card) => ({ ...card, position: { ...card.position } }))
}

function cloneEdges(edges: CanvasEdge[]): CanvasEdge[] {
  return edges.map((edge) => ({ ...edge }))
}

function buildPreview(message: string, cards: Card[], edges: CanvasEdge[]): PreviewPayload {
  const previewId = `preview-${Date.now()}`
  const nextCards = cloneCards(cards)
  const nextEdges = cloneEdges(edges)

  const openQuestion: Card = {
    id: `oq-${Date.now()}`,
    specRef: { file: 'open-questions.md', anchor: 'OQ-preview' },
    type: 'open-question',
    title: 'Open question (preview)',
    body: `From chat: "${message}" — which enterprise domains should be allowed for Google login?`,
    position: { x: 520, y: -40 },
    status: 'proposed',
  }

  const featureCard = nextCards.find((card) => card.id === 'features')
  if (featureCard?.vizType === 'data-table' && featureCard.vizPayload) {
    const payload = featureCard.vizPayload as {
      columns: string[]
      rows: string[][]
    }
    featureCard.vizPayload = {
      ...payload,
      rows: [
        ...payload.rows,
        ['F-004', 'Google login', 'proposed', 'high'],
      ],
    }
  }

  nextCards.push(openQuestion)
  nextEdges.push({
    id: `e-preview-${openQuestion.id}`,
    source: 'features',
    target: openQuestion.id,
    label: 'raises',
  })

  return {
    previewId,
    cards: nextCards,
    edges: nextEdges,
    mdPatches: [
      {
        file: 'open-questions.md',
        action: 'add',
        anchor: 'OQ-preview',
        summary: 'Add open question about allowed Google domains',
      },
      {
        file: 'features.md',
        action: 'add',
        anchor: 'F-004',
        summary: 'Propose F-004 Google login feature',
      },
    ],
    summary: 'Preview adds F-004 Google login and an open question card linked from Features.',
  }
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  projectName: SAMPLE_PROJECT_NAME,
  committedCards: cloneCards(sampleCanvas.cards),
  committedEdges: cloneEdges(sampleCanvas.edges),
  centerCardId: sampleCanvas.centerCardId,
  preview: null,
  selectedCardId: null,
  isTranslating: false,
  chatDraft: '',

  setChatDraft: (value) => set({ chatDraft: value }),

  selectCard: (cardId) => set({ selectedCardId: cardId }),

  updateCard: (cardId, patch) =>
    set((state) => ({
      committedCards: state.committedCards.map((card) =>
        card.id === cardId ? { ...card, ...patch } : card,
      ),
    })),

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

    await new Promise((resolve) => setTimeout(resolve, 900))

    const { committedCards, committedEdges } = get()
    const preview = buildPreview(trimmed, committedCards, committedEdges)

    set({ preview, isTranslating: false })
  },

  commitPreview: () =>
    set((state) => {
      if (!state.preview) return state

      return {
        committedCards: cloneCards(state.preview.cards),
        committedEdges: cloneEdges(state.preview.edges),
        preview: null,
        selectedCardId: null,
      }
    }),

  discardPreview: () => set({ preview: null, selectedCardId: null }),
}))
