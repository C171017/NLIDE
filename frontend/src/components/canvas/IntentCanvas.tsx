import { useCallback, useEffect, useMemo } from 'react'
import {
  Background,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type OnNodesChange,
} from '@xyflow/react'
import type { Card, CanvasEdge } from '../../types/canvas'
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

export default function IntentCanvas() {
  const committedCards = useCanvasStore((state) => state.committedCards)
  const committedEdges = useCanvasStore((state) => state.committedEdges)
  const centerCardId = useCanvasStore((state) => state.centerCardId)
  const preview = useCanvasStore((state) => state.preview)
  const selectedCardId = useCanvasStore((state) => state.selectedCardId)
  const selectCard = useCanvasStore((state) => state.selectCard)
  const moveCard = useCanvasStore((state) => state.moveCard)

  const activeCards = preview?.cards ?? committedCards
  const activeEdges = preview?.edges ?? committedEdges

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
          activeCards,
          centerCardId,
          previewCardIds,
          selectedCardId,
          selectCard,
        ),
        activeEdges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })),
        centerCardId,
      ),
    [activeCards, activeEdges, centerCardId, previewCardIds, selectedCardId, selectCard],
  )

  const initialEdges = useMemo(
    () => edgesToFlow(activeEdges, previewEdgeIds, initialNodes, centerCardId),
    [activeEdges, centerCardId, initialNodes, previewEdgeIds],
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

  return (
    <div className="intent-canvas h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.35}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#1f2433" />
        <MiniMap
          className="hidden 2xl:block"
          nodeColor={(node) => (node.type === 'index' ? '#f59e0b' : '#374151')}
          maskColor="rgba(15, 17, 23, 0.75)"
        />
      </ReactFlow>
    </div>
  )
}
