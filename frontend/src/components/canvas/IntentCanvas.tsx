import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type OnMove,
  type OnNodesChange,
} from '@xyflow/react'
import type { Card, CanvasEdge } from '../../types/canvas'
import {
  filterVisibleCards,
  filterVisibleEdges,
  focusLabel,
  resolveViewMode,
  ZOOM_DETAIL_THRESHOLD,
} from '../../lib/canvasLayers'
import { getNodeLayoutBox, layoutNodes } from '../../lib/layout'
import { useCanvasStore } from '../../store/canvasStore'
import CardNode from './nodes/CardNode'
import IndexNode from './nodes/IndexNode'
import LabeledEdge from './edges/LabeledEdge'

const nodeTypes = {
  index: IndexNode,
  card: CardNode,
}

const edgeTypes = {
  labeled: LabeledEdge,
}

const oppositePosition = {
  [Position.Top]: Position.Bottom,
  [Position.Right]: Position.Left,
  [Position.Bottom]: Position.Top,
  [Position.Left]: Position.Right,
}

function handleId(type: 'source' | 'target', position: Position) {
  return `${type}-${position}`
}

function cardsToNodes(
  cards: Card[],
  centerCardId: string,
  previewCardIds: Set<string>,
  selectedCardId: string | null,
  onSelect: (cardId: string) => void,
): Node[] {
  return cards.map((card) => ({
    id: card.id,
    type: card.id === centerCardId ? 'index' : 'card',
    position: card.position,
    data: {
      card,
      isPreview: previewCardIds.has(card.id),
      isSelected: selectedCardId === card.id,
      onSelect,
    },
    draggable: true,
  }))
}

function nodeCenter(node: Node, centerCardId: string) {
  const box = getNodeLayoutBox(node, centerCardId)

  return {
    x: node.position.x + box.width / 2,
    y: node.position.y + box.height / 2,
  }
}

function nearestSide(source: Node, target: Node, centerCardId: string) {
  const sourceCenter = nodeCenter(source, centerCardId)
  const targetCenter = nodeCenter(target, centerCardId)
  const dx = targetCenter.x - sourceCenter.x
  const dy = targetCenter.y - sourceCenter.y

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0 ? Position.Right : Position.Left
  }

  return dy >= 0 ? Position.Bottom : Position.Top
}

function edgesToFlow(
  canvasEdges: CanvasEdge[],
  previewEdgeIds: Set<string>,
  nodes: Node[],
  centerCardId: string,
): Edge[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]))

  return canvasEdges.map((edge) => {
    const source = nodesById.get(edge.source)
    const target = nodesById.get(edge.target)
    const sourceSide = source && target ? nearestSide(source, target, centerCardId) : Position.Bottom
    const targetSide = oppositePosition[sourceSide]

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: handleId('source', sourceSide),
      targetHandle: handleId('target', targetSide),
      type: 'labeled',
      data: {
        label: edge.label,
        isPreview: previewEdgeIds.has(edge.id),
      },
    }
  })
}

function diffPreview(
  committedCards: Card[],
  committedEdges: CanvasEdge[],
  previewCards: Card[],
  previewEdges: CanvasEdge[],
) {
  const committedCardIds = new Set(committedCards.map((card) => card.id))
  const committedEdgeIds = new Set(committedEdges.map((edge) => edge.id))

  const previewCardIds = new Set(
    previewCards.filter((card) => !committedCardIds.has(card.id)).map((card) => card.id),
  )

  const previewEdgeIds = new Set(
    previewEdges.filter((edge) => !committedEdgeIds.has(edge.id)).map((edge) => edge.id),
  )

  return { previewCardIds, previewEdgeIds }
}

function CanvasLayerPanel({
  mode,
  label,
  zoom,
}: {
  mode: 'top' | 'detail'
  label: string
  zoom: number
}) {
  return (
    <Panel position="top-left" className="pointer-events-none">
      <div className="rounded-lg border border-[#2a3144] bg-[#12151c]/90 px-3 py-2 text-xs text-[#b6bcc8] shadow-lg backdrop-blur-sm">
        <div className="font-medium text-[#e5e7eb]">
          {mode === 'top' ? 'Overview layer' : label}
        </div>
        <div className="mt-0.5 text-[10px] text-[#7c8494]">
          {mode === 'top'
            ? 'Select a pillar and zoom in to reveal detail cards'
            : 'Zoom out to return to Product · Frontend · Backend'}
        </div>
        <div className="mt-1 text-[10px] tabular-nums text-[#6b7280]">
          zoom {Math.round(zoom * 100)}%
          {mode === 'top' && ` · detail ≥ ${Math.round(ZOOM_DETAIL_THRESHOLD * 100)}%`}
        </div>
      </div>
    </Panel>
  )
}

export default function IntentCanvas() {
  const committedCards = useCanvasStore((state) => state.committedCards)
  const committedEdges = useCanvasStore((state) => state.committedEdges)
  const centerCardId = useCanvasStore((state) => state.centerCardId)
  const preview = useCanvasStore((state) => state.preview)
  const selectedCardId = useCanvasStore((state) => state.selectedCardId)
  const selectCard = useCanvasStore((state) => state.selectCard)
  const moveCard = useCanvasStore((state) => state.moveCard)

  const [zoom, setZoom] = useState(1)

  const activeCards = preview?.cards ?? committedCards
  const activeEdges = preview?.edges ?? committedEdges

  const { mode: viewMode, focusId } = useMemo(
    () => resolveViewMode(zoom, selectedCardId, activeCards),
    [zoom, selectedCardId, activeCards],
  )

  const visibleCards = useMemo(
    () => filterVisibleCards(activeCards, viewMode, focusId),
    [activeCards, viewMode, focusId],
  )

  const visibleCardIds = useMemo(
    () => new Set(visibleCards.map((card) => card.id)),
    [visibleCards],
  )

  const visibleEdges = useMemo(
    () => filterVisibleEdges(activeEdges, visibleCardIds, viewMode, focusId),
    [activeEdges, visibleCardIds, viewMode, focusId],
  )

  const { previewCardIds, previewEdgeIds } = useMemo(
    () =>
      preview
        ? diffPreview(committedCards, committedEdges, preview.cards, preview.edges)
        : { previewCardIds: new Set<string>(), previewEdgeIds: new Set<string>() },
    [committedCards, committedEdges, preview],
  )

  const initialNodes = useMemo(
    () =>
      layoutNodes(
        cardsToNodes(
          visibleCards,
          centerCardId,
          previewCardIds,
          selectedCardId,
          selectCard,
        ),
        visibleEdges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })),
        centerCardId,
        viewMode,
        focusId,
      ),
    [
      visibleCards,
      visibleEdges,
      centerCardId,
      previewCardIds,
      selectedCardId,
      selectCard,
      viewMode,
      focusId,
    ],
  )

  const initialEdges = useMemo(
    () => edgesToFlow(visibleEdges, previewEdgeIds, initialNodes, centerCardId),
    [visibleEdges, centerCardId, initialNodes, previewEdgeIds],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes)

      for (const change of changes) {
        if (change.type === 'position' && change.position && !change.dragging) {
          moveCard(change.id, change.position)
        }
      }
    },
    [moveCard, onNodesChange],
  )

  const handleMove: OnMove = useCallback((_event, viewport) => {
    setZoom(viewport.zoom)
  }, [])

  return (
    <div className="intent-canvas h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onMove={handleMove}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.35}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#1f2433" />
        <CanvasLayerPanel
          mode={viewMode}
          label={focusLabel(activeCards, focusId)}
          zoom={zoom}
        />
        <MiniMap
          className="hidden 2xl:block"
          nodeColor={(node) => (node.type === 'index' ? '#f59e0b' : '#374151')}
          maskColor="rgba(15, 17, 23, 0.75)"
        />
      </ReactFlow>
    </div>
  )
}
