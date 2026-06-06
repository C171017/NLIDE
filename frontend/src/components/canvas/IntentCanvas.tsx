import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
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
import { canDeleteCard } from '../../lib/canDeleteCard'
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
import DeleteModeTrash from './DeleteModeTrash'
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

const TRASH_HIT_PADDING_PX = 20

function isPointInRect(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  padding = 0,
): boolean {
  return (
    clientX >= rect.left - padding &&
    clientX <= rect.right + padding &&
    clientY >= rect.top - padding &&
    clientY <= rect.bottom + padding
  )
}

function layerKey(layer: DisplayedLayer) {
  return `${layer.mode}:${layer.focusId ?? 'overview'}`
}

function pointerClientPosition(event: MouseEvent | TouchEvent): { x: number; y: number } | null {
  if ('clientX' in event) {
    return { x: event.clientX, y: event.clientY }
  }

  const touch = event.changedTouches[0] ?? event.touches[0]
  if (!touch) return null

  return { x: touch.clientX, y: touch.clientY }
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

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

function edgesToFlow(
  canvasEdges: CanvasEdge[],
  previewEdgeIds: Set<string>,
  selectedEdgeId: string | null,
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
        isSelected: edge.id === selectedEdgeId,
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
  const setCardPositions = useCanvasStore((state) => state.setCardPositions)
  const isDeleteMode = useCanvasStore((state) => state.isDeleteMode)
  const selectedEdgeId = useCanvasStore((state) => state.selectedEdgeId)
  const exitDeleteMode = useCanvasStore((state) => state.exitDeleteMode)
  const deleteCard = useCanvasStore((state) => state.deleteCard)
  const deleteEdge = useCanvasStore((state) => state.deleteEdge)
  const toggleSelectEdge = useCanvasStore((state) => state.toggleSelectEdge)

  const trashRef = useRef<HTMLDivElement>(null)
  const trashHoveredRef = useRef(false)
  const deleteDragStateRef = useRef<{
    nodeId: string
    origin: { x: number; y: number }
    finished: boolean
  } | null>(null)
  const deleteDragMoveHandlerRef = useRef<((event: PointerEvent) => void) | null>(null)
  const deleteDragUpHandlerRef = useRef<((event: PointerEvent) => void) | null>(null)
  const [isTrashHovered, setIsTrashHovered] = useState(false)

  const activeCards = preview?.cards ?? committedCards
  const activeEdges = preview?.edges ?? committedEdges

  const updateTrashHover = useCallback((clientX: number, clientY: number) => {
    const trash = trashRef.current
    if (!trash) {
      trashHoveredRef.current = false
      setIsTrashHovered(false)
      return
    }

    const hovered = isPointInRect(
      clientX,
      clientY,
      trash.getBoundingClientRect(),
      TRASH_HIT_PADDING_PX,
    )
    trashHoveredRef.current = hovered
    setIsTrashHovered(hovered)
  }, [])

  const cleanupDeleteDragListeners = useCallback(() => {
    if (deleteDragMoveHandlerRef.current) {
      window.removeEventListener('pointermove', deleteDragMoveHandlerRef.current)
      deleteDragMoveHandlerRef.current = null
    }

    if (deleteDragUpHandlerRef.current) {
      window.removeEventListener('pointerup', deleteDragUpHandlerRef.current)
      deleteDragUpHandlerRef.current = null
    }
  }, [])

  const handlePaneClick = useCallback(() => {
    if (isDeleteMode) {
      exitDeleteMode()
      return
    }

    selectCard(null)
  }, [exitDeleteMode, isDeleteMode, selectCard])

  useEffect(() => {
    if (!isDeleteMode) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        exitDeleteMode()
        return
      }

      if (isEditableTarget(event.target)) return

      if (event.key === 'Delete' || event.key === 'Backspace') {
        const edgeId = useCanvasStore.getState().selectedEdgeId
        if (!edgeId) return

        event.preventDefault()
        deleteEdge(edgeId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [deleteEdge, exitDeleteMode, isDeleteMode])

  useEffect(() => {
    if (isDeleteMode) return undefined

    cleanupDeleteDragListeners()
    deleteDragStateRef.current = null
    trashHoveredRef.current = false
    setIsTrashHovered(false)

    return cleanupDeleteDragListeners
  }, [cleanupDeleteDragListeners, isDeleteMode])

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

  const baseNodes = useMemo(
    () => cardsToNodes(visibleCards, centerCardId, previewCardIds),
    [visibleCards, centerCardId, previewCardIds],
  )

  const structuralKey = useMemo(
    () =>
      `${layerKey(displayedLayer)}|${visibleCards.map((card) => card.id).join(',')}|${[...previewCardIds].sort().join(',')}`,
    [displayedLayer, visibleCards, previewCardIds],
  )

  const flowEdges = useMemo(
    () => edgesToFlow(visibleEdges, previewEdgeIds, selectedEdgeId, baseNodes, centerCardId),
    [visibleEdges, centerCardId, baseNodes, previewEdgeIds, selectedEdgeId],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  const prevStructuralKeyRef = useRef('')

  useEffect(() => {
    const structureChanged = prevStructuralKeyRef.current !== structuralKey
    prevStructuralKeyRef.current = structuralKey

    if (structureChanged) {
      const laidOutNodes = layoutNodes(
        baseNodes,
        visibleEdges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })),
        centerCardId,
        viewMode,
        focusId,
      )

      setNodes(laidOutNodes)
      setCardPositions(
        laidOutNodes.map((node) => ({
          id: node.id,
          position: node.position,
        })),
      )
      return
    }

    setNodes(baseNodes)
  }, [
    structuralKey,
    baseNodes,
    visibleEdges,
    centerCardId,
    viewMode,
    focusId,
    setNodes,
    setCardPositions,
  ])

  useEffect(() => {
    setEdges(flowEdges)
  }, [flowEdges, setEdges])

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes)

      if (isDeleteMode) {
        return
      }

      for (const change of changes) {
        if (change.type === 'position' && change.position && !change.dragging) {
          moveCard(change.id, change.position)
        }
      }
    },
    [isDeleteMode, moveCard, onNodesChange],
  )

  const finishDeleteDrag = useCallback(
    (nodeId: string) => {
      const dragState = deleteDragStateRef.current
      if (!dragState || dragState.nodeId !== nodeId || dragState.finished) {
        return
      }

      dragState.finished = true
      cleanupDeleteDragListeners()

      const shouldDelete =
        trashHoveredRef.current && canDeleteCard(nodeId, centerCardId, activeCards)

      if (shouldDelete) {
        deleteCard(nodeId)
      } else {
        const { origin } = dragState
        setNodes((currentNodes) =>
          currentNodes.map((node) =>
            node.id === nodeId ? { ...node, position: { ...origin } } : node,
          ),
        )
      }

      deleteDragStateRef.current = null
      trashHoveredRef.current = false
      setIsTrashHovered(false)
    },
    [activeCards, centerCardId, cleanupDeleteDragListeners, deleteCard, setNodes],
  )

  const handleNodeDragStart = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node) => {
      if (!isDeleteMode) return

      cleanupDeleteDragListeners()

      deleteDragStateRef.current = {
        nodeId: node.id,
        origin: { ...node.position },
        finished: false,
      }

      const onPointerMove = (event: PointerEvent) => {
        updateTrashHover(event.clientX, event.clientY)
      }

      const onPointerUp = (event: PointerEvent) => {
        updateTrashHover(event.clientX, event.clientY)
        finishDeleteDrag(node.id)
      }

      deleteDragMoveHandlerRef.current = onPointerMove
      deleteDragUpHandlerRef.current = onPointerUp
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
    },
    [cleanupDeleteDragListeners, finishDeleteDrag, isDeleteMode, updateTrashHover],
  )

  const handleNodeDrag = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!isDeleteMode) return
      const pointer = pointerClientPosition(event)
      if (!pointer) return
      updateTrashHover(pointer.x, pointer.y)
    },
    [isDeleteMode, updateTrashHover],
  )

  const handleNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node) => {
      if (!isDeleteMode) {
        trashHoveredRef.current = false
        setIsTrashHovered(false)
        return
      }

      finishDeleteDrag(node.id)
    },
    [finishDeleteDrag, isDeleteMode],
  )

  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (!isDeleteMode) return
      toggleSelectEdge(edge.id)
    },
    [isDeleteMode, toggleSelectEdge],
  )

  return (
    <div
      className={clsx(
        'intent-canvas relative h-full w-full',
        `canvas-layer-${transitionPhase}`,
        isDeleteMode && 'canvas-delete-mode',
      )}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={handlePaneClick}
        onEdgeClick={handleEdgeClick}
        onNodeDragStart={handleNodeDragStart}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        elementsSelectable={false}
        panOnDrag={!isDeleteMode}
        autoPanOnNodeDrag={!isDeleteMode}
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
        <ExcalidrawStyleGestures />
        <LayerViewportAnimator
          layerKeyValue={layerKey(displayedLayer)}
          transitionPhase={transitionPhase}
        />
        <CanvasNavPanel
          mode={resolvedLayer.mode}
          transitionPhase={transitionPhase}
          hidden={isDeleteMode}
          onNavigateOverview={drillOut}
        />
      </ReactFlow>
      {isDeleteMode && <DeleteModeTrash ref={trashRef} isHovered={isTrashHovered} />}
      <ChatBar />
    </div>
  )
}
