import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Position,
  ReactFlow,
  useReactFlow,
  useEdgesState,
  useNodesState,
  useViewport,
  type Edge,
  type Node,
  type OnNodesChange,
} from '@xyflow/react'
import type { Card, CanvasEdge } from '../../types/canvas'
import { diffPreview } from '@nlide/shared/diffPreview'
import {
  filterVisibleCards,
  filterVisibleEdges,
  resolveViewMode,
  type CanvasViewMode,
} from '../../lib/canvasLayers'
import { getNodeLayoutBox, layoutNodes } from '../../lib/layout'
import { useCanvasStore } from '../../store/canvasStore'
import CardNode from './nodes/CardNode'
import IndexNode from './nodes/IndexNode'
import LabeledEdge from './edges/LabeledEdge'
import CanvasNavPanel from './CanvasNavPanel'
import ChatBar from '../chat/ChatBar'

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
): Node[] {
  return cards.map((card) => ({
    id: card.id,
    type: card.id === centerCardId ? 'index' : 'card',
    position: card.position,
    data: {
      card,
      isPreview: previewCardIds.has(card.id),
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
  const drillFocusId = useCanvasStore((state) => state.drillFocusId)
  const drillOut = useCanvasStore((state) => state.drillOut)
  const selectCard = useCanvasStore((state) => state.selectCard)
  const moveCard = useCanvasStore((state) => state.moveCard)

  const activeCards = preview?.cards ?? committedCards
  const activeEdges = preview?.edges ?? committedEdges

  const handlePaneClick = useCallback(() => {
    selectCard(null)
  }, [selectCard])

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
        cardsToNodes(visibleCards, centerCardId, previewCardIds),
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

  return (
    <div className={`intent-canvas canvas-layer-${transitionPhase} relative h-full w-full`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
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
        <CanvasNavPanel
          mode={viewMode}
          transitionPhase={transitionPhase}
          onNavigateOverview={drillOut}
        />
      </ReactFlow>
      <ChatBar />
    </div>
  )
}
