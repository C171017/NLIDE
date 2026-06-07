import { memo, useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { CanvasEdge, Card } from '../../types/canvas'
import { cardTypeStyles } from '../../lib/cardStyles'

interface PreviewNodeData {
  label: string
  cardType: Card['type']
}

function PreviewCardNode({ data }: { data: PreviewNodeData }) {
  return (
    <div
      className={`project-preview-node ${cardTypeStyles(data.cardType)}`}
      title={data.label}
    >
      <span className="project-preview-node__label">{data.label}</span>
    </div>
  )
}

const nodeTypes = {
  previewCard: PreviewCardNode,
}

function cardsToNodes(cards: Card[]): Node[] {
  return cards.map((card) => ({
    id: card.id,
    type: 'previewCard',
    position: card.position,
    data: { label: card.title, cardType: card.type },
    draggable: false,
    selectable: false,
    connectable: false,
  }))
}

function edgesToFlow(edges: CanvasEdge[]): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: false,
    selectable: false,
  }))
}

interface ProjectCanvasPreviewInnerProps {
  cards: Card[]
  edges: CanvasEdge[]
}

function ProjectCanvasPreviewInner({ cards, edges }: ProjectCanvasPreviewInnerProps) {
  const nodes = useMemo(() => cardsToNodes(cards), [cards])
  const flowEdges = useMemo(() => edgesToFlow(edges), [edges])

  if (cards.length === 0) {
    return (
      <div className="project-preview project-preview--empty">
        <span className="project-preview__placeholder">Blank canvas</span>
      </div>
    )
  }

  return (
    <div className="project-preview">
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="rgba(120,113,108,0.25)" />
      </ReactFlow>
    </div>
  )
}

interface ProjectCanvasPreviewProps {
  cards: Card[]
  edges: CanvasEdge[]
}

function ProjectCanvasPreview({ cards, edges }: ProjectCanvasPreviewProps) {
  return (
    <ReactFlowProvider>
      <ProjectCanvasPreviewInner cards={cards} edges={edges} />
    </ReactFlowProvider>
  )
}

export default memo(ProjectCanvasPreview)
