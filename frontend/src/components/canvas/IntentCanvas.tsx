import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  useReactFlow,
  useEdgesState,
  useNodesState,
  useViewport,
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
  isTopLayerCard,
  resolveViewMode,
  type CanvasViewMode,
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

const TRANSITION_OUT_MS = 160
const TRANSITION_IN_MS = 280
const FIT_VIEW_DURATION_MS = 360
const MIN_ZOOM = 0.35
const MAX_ZOOM = 1.5
const WHEEL_ZOOM_SENSITIVITY = 0.0025
const VIEWPORT_LERP = 0.42
const VIEWPORT_EPSILON = 0.4

type LayerTransitionPhase = 'idle' | 'leaving' | 'entering'

interface DisplayedLayer {
  mode: CanvasViewMode
  focusId: string | null
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

function layerKey(layer: DisplayedLayer) {
  return `${layer.mode}:${layer.focusId ?? 'overview'}`
}

function cardsToNodes(
  cards: Card[],
  centerCardId: string,
  previewCardIds: Set<string>,
  onSelect: (cardId: string) => void,
): Node[] {
  return cards.map((card) => ({
    id: card.id,
    type: card.id === centerCardId ? 'index' : 'card',
    position: card.position,
    data: {
      card,
      isPreview: previewCardIds.has(card.id),
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
            ? 'Click a pillar to drill in · two-finger pan · pinch zoom'
            : 'Click the pillar again to return to overview'}
        </div>
        <div className="mt-1 text-[10px] tabular-nums text-[#6b7280]">zoom {Math.round(zoom * 100)}%</div>
      </div>
    </Panel>
  )
}

function normalizeWheelDelta(event: WheelEvent) {
  const multiplier =
    event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? window.innerHeight
        : 1

  return {
    x: event.deltaX * multiplier,
    y: event.deltaY * multiplier,
  }
}

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

function ExcalidrawStyleGestures() {
  const reactFlow = useReactFlow()
  const liveViewport = useViewport()
  const rafRef = useRef<number | null>(null)
  const targetViewportRef = useRef(reactFlow.getViewport())

  useEffect(() => {
    if (rafRef.current === null) {
      targetViewportRef.current = liveViewport
    }
  }, [liveViewport])

  useEffect(() => {
    const pane = document.querySelector<HTMLElement>('.intent-canvas .react-flow__pane')

    if (!pane) return undefined

    const animate = () => {
      const current = reactFlow.getViewport()
      const target = targetViewportRef.current
      const next = {
        x: current.x + (target.x - current.x) * VIEWPORT_LERP,
        y: current.y + (target.y - current.y) * VIEWPORT_LERP,
        zoom: current.zoom + (target.zoom - current.zoom) * VIEWPORT_LERP,
      }
      const done =
        Math.abs(next.x - target.x) < VIEWPORT_EPSILON &&
        Math.abs(next.y - target.y) < VIEWPORT_EPSILON &&
        Math.abs(next.zoom - target.zoom) < 0.001

      void reactFlow.setViewport(done ? target : next, { duration: 0 })

      if (done) {
        rafRef.current = null
        return
      }

      rafRef.current = window.requestAnimationFrame(animate)
    }

    const startAnimation = () => {
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(animate)
      }
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()

      const rect = pane.getBoundingClientRect()
      const delta = normalizeWheelDelta(event)
      const current = targetViewportRef.current ?? reactFlow.getViewport()
      const isZoomGesture = event.ctrlKey || event.metaKey

      if (isZoomGesture) {
        const pointer = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        }
        const nextZoom = clampZoom(current.zoom * Math.exp(-delta.y * WHEEL_ZOOM_SENSITIVITY))
        const flowPoint = {
          x: (pointer.x - current.x) / current.zoom,
          y: (pointer.y - current.y) / current.zoom,
        }

        targetViewportRef.current = {
          x: pointer.x - flowPoint.x * nextZoom,
          y: pointer.y - flowPoint.y * nextZoom,
          zoom: nextZoom,
        }
      } else {
        const horizontalDelta = event.shiftKey && Math.abs(delta.x) < 1 ? delta.y : delta.x
        const verticalDelta = event.shiftKey ? 0 : delta.y

        targetViewportRef.current = {
          x: current.x - horizontalDelta,
          y: current.y - verticalDelta,
          zoom: current.zoom,
        }
      }

      startAnimation()
    }

    pane.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      pane.removeEventListener('wheel', handleWheel)

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [reactFlow])

  return null
}

function LayerViewportAnimator({
  layerKeyValue,
  transitionPhase,
}: {
  layerKeyValue: string
  transitionPhase: LayerTransitionPhase
}) {
  const reactFlow = useReactFlow()
  const lastLayerKeyRef = useRef(layerKeyValue)

  useEffect(() => {
    if (transitionPhase !== 'entering' || lastLayerKeyRef.current === layerKeyValue) {
      return undefined
    }

    lastLayerKeyRef.current = layerKeyValue

    const fitTimer = window.setTimeout(() => {
      void reactFlow.fitView({
        duration: FIT_VIEW_DURATION_MS,
        padding: 0.24,
      })
    }, 40)

    return () => {
      window.clearTimeout(fitTimer)
    }
  }, [layerKeyValue, reactFlow, transitionPhase])

  return null
}

export default function IntentCanvas() {
  const committedCards = useCanvasStore((state) => state.committedCards)
  const committedEdges = useCanvasStore((state) => state.committedEdges)
  const centerCardId = useCanvasStore((state) => state.centerCardId)
  const preview = useCanvasStore((state) => state.preview)
  const selectedCardId = useCanvasStore((state) => state.selectedCardId)
  const drillFocusId = useCanvasStore((state) => state.drillFocusId)
  const selectCard = useCanvasStore((state) => state.selectCard)
  const drillIntoCard = useCanvasStore((state) => state.drillIntoCard)
  const drillOut = useCanvasStore((state) => state.drillOut)
  const moveCard = useCanvasStore((state) => state.moveCard)

  const activeCards = preview?.cards ?? committedCards
  const activeEdges = preview?.edges ?? committedEdges

  const handleSelectCard = useCallback(
    (cardId: string) => {
      const card = activeCards.find((item) => item.id === cardId)
      if (!card) return

      if (isTopLayerCard(card)) {
        if (drillFocusId === cardId) {
          drillOut()
        } else {
          drillIntoCard(cardId)
        }
        return
      }

      selectCard(selectedCardId === cardId ? null : cardId)
    },
    [activeCards, drillFocusId, drillIntoCard, drillOut, selectCard, selectedCardId],
  )

  const handlePaneClick = useCallback(() => {
    selectCard(null)
  }, [selectCard])

  const [zoom, setZoom] = useState(1)

  const resolvedLayer = useMemo(
    () => resolveViewMode(drillFocusId, activeCards),
    [drillFocusId, activeCards],
  )
  const [displayedLayer, setDisplayedLayer] = useState<DisplayedLayer>(resolvedLayer)
  const [transitionPhase, setTransitionPhase] = useState<LayerTransitionPhase>('idle')
  const pendingLayerRef = useRef<DisplayedLayer>(resolvedLayer)

  useEffect(() => {
    const nextKey = layerKey(resolvedLayer)
    const currentKey = layerKey(displayedLayer)

    pendingLayerRef.current = resolvedLayer

    if (nextKey === currentKey) {
      return undefined
    }

    const leaveFrame = window.requestAnimationFrame(() => {
      setTransitionPhase('leaving')
    })

    const swapTimer = window.setTimeout(() => {
      setDisplayedLayer(pendingLayerRef.current)
      setTransitionPhase('entering')
    }, TRANSITION_OUT_MS)

    const settleTimer = window.setTimeout(() => {
      setTransitionPhase('idle')
    }, TRANSITION_OUT_MS + TRANSITION_IN_MS)

    return () => {
      window.cancelAnimationFrame(leaveFrame)
      window.clearTimeout(swapTimer)
      window.clearTimeout(settleTimer)
    }
  }, [displayedLayer, resolvedLayer])

  const viewMode = displayedLayer.mode
  const focusId = displayedLayer.focusId

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
          handleSelectCard,
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
      handleSelectCard,
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
    <div className={`intent-canvas canvas-layer-${transitionPhase} h-full w-full`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onMove={handleMove}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#1f2433" />
        <ExcalidrawStyleGestures />
        <LayerViewportAnimator
          layerKeyValue={layerKey(displayedLayer)}
          transitionPhase={transitionPhase}
        />
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
