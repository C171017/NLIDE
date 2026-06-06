import type { CanvasEdge, Card, PreviewPayload } from '../types/canvas'

function cloneCards(cards: Card[]): Card[] {
  return cards.map((card) => ({ ...card, position: { ...card.position } }))
}

function cloneEdges(edges: CanvasEdge[]): CanvasEdge[] {
  return edges.map((edge) => ({ ...edge }))
}

/** Local fallback when InsForge function URL is not configured. */
export function buildPreviewLocal(
  message: string,
  cards: Card[],
  edges: CanvasEdge[],
): PreviewPayload {
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
    layer: 1,
    parentCardId: 'product',
    status: 'proposed',
  }

  const featureCard = nextCards.find((card) => card.id === 'features')
  if (featureCard?.vizType === 'data-table' && featureCard.vizPayload) {
    const payload = featureCard.vizPayload as { columns: string[]; rows: string[][] }
    featureCard.vizPayload = {
      ...payload,
      rows: [...payload.rows, ['F-004', 'Google login', 'proposed', 'high']],
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
