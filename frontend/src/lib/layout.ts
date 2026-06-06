import type { Edge, Node } from '@xyflow/react'
import { TOP_LAYER_SPREAD, type CanvasViewMode } from './canvasLayers'

const NODE_WIDTH = 260
const NODE_HEIGHT = 150
const HUB_WIDTH = 300
const HUB_HEIGHT = 260
const DEFAULT_RING_RADIUS = 420
const RING_STEP = 360
const COLLISION_GAP = 48

/** Rotate equal ring spacing so pillars sit left/right of the hub. */
function assignRingAngles(ids: string[]): Map<string, number> {
  const ordered = orderRingNodeIds(ids)
  const count = ordered.length
  const angles = new Map<string, number>()
  if (count === 0) return angles

  const step = (Math.PI * 2) / count
  const baseStart = -Math.PI / 2
  let rotation = 0

  if (ordered.includes('frontend')) {
    const index = ordered.indexOf('frontend')
    rotation = Math.PI - (baseStart + index * step)
  } else if (ordered.includes('backend')) {
    const index = ordered.indexOf('backend')
    rotation = -Math.PI / 2 - index * step
  }

  ordered.forEach((id, index) => {
    angles.set(id, baseStart + index * step + rotation)
  })

  return angles
}

interface NodeBox {
  id: string
  width: number
  height: number
}

interface Point {
  x: number
  y: number
}

export function getNodeLayoutBox(node: Node, centerId: string): NodeBox {
  const card = (node.data as { card?: { vizType?: string } } | undefined)?.card
  const hasViz = Boolean(card?.vizType)
  const hasProgressChecklist = card?.vizType === 'progress-checklist'
  const isHub = node.id === centerId

  if (isHub) {
    return {
      id: node.id,
      width: HUB_WIDTH,
      height: hasViz ? HUB_HEIGHT : 170,
    }
  }

  return {
    id: node.id,
    width: hasProgressChecklist ? 300 : NODE_WIDTH,
    height: hasProgressChecklist ? 290 : hasViz ? 250 : NODE_HEIGHT,
  }
}

function centerOf(node: Node, box: NodeBox): Point {
  return {
    x: node.position.x + box.width / 2,
    y: node.position.y + box.height / 2,
  }
}

function fallbackDirection(index: number, total: number): Point {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / Math.max(total, 1)

  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
  }
}

function normalizedDirection(point: Point, fallback: Point): Point {
  const length = Math.hypot(point.x, point.y)

  if (length < 1) {
    return fallback
  }

  return {
    x: point.x / length,
    y: point.y / length,
  }
}

function radialDistance(centerBox: NodeBox, nodeBox: NodeBox, direction: Point): number {
  const distances = []
  const absX = Math.abs(direction.x)
  const absY = Math.abs(direction.y)

  if (absX > 0.05) {
    distances.push((centerBox.width / 2 + nodeBox.width / 2 + COLLISION_GAP) / absX)
  }

  if (absY > 0.05) {
    distances.push((centerBox.height / 2 + nodeBox.height / 2 + COLLISION_GAP) / absY)
  }

  return Math.max(DEFAULT_RING_RADIUS, Math.min(...distances))
}

function rectFor(center: Point, box: NodeBox, gap = 0) {
  return {
    left: center.x - box.width / 2 - gap / 2,
    right: center.x + box.width / 2 + gap / 2,
    top: center.y - box.height / 2 - gap / 2,
    bottom: center.y + box.height / 2 + gap / 2,
  }
}

function resolveCollisions(
  positions: Map<string, Point>,
  boxes: Map<string, NodeBox>,
  fixedId: string,
) {
  const ids = [...positions.keys()]

  for (let pass = 0; pass < 32; pass += 1) {
    let moved = false

    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const firstId = ids[i]
        const secondId = ids[j]
        const first = positions.get(firstId)
        const second = positions.get(secondId)
        const firstBox = boxes.get(firstId)
        const secondBox = boxes.get(secondId)

        if (!first || !second || !firstBox || !secondBox) continue

        const firstRect = rectFor(first, firstBox, COLLISION_GAP)
        const secondRect = rectFor(second, secondBox, COLLISION_GAP)
        const overlapX = Math.min(firstRect.right, secondRect.right) - Math.max(firstRect.left, secondRect.left)
        const overlapY = Math.min(firstRect.bottom, secondRect.bottom) - Math.max(firstRect.top, secondRect.top)

        if (overlapX <= 0 || overlapY <= 0) continue

        moved = true

        const pushX = overlapX <= overlapY
        const direction = pushX
          ? { x: first.x <= second.x ? 1 : -1, y: 0 }
          : { x: 0, y: first.y <= second.y ? 1 : -1 }
        const distance = (pushX ? overlapX : overlapY) / 2

        if (firstId === fixedId) {
          positions.set(secondId, {
            x: second.x + direction.x * (distance * 2),
            y: second.y + direction.y * (distance * 2),
          })
        } else if (secondId === fixedId) {
          positions.set(firstId, {
            x: first.x - direction.x * (distance * 2),
            y: first.y - direction.y * (distance * 2),
          })
        } else {
          positions.set(firstId, {
            x: first.x - direction.x * distance,
            y: first.y - direction.y * distance,
          })
          positions.set(secondId, {
            x: second.x + direction.x * distance,
            y: second.y + direction.y * distance,
          })
        }
      }
    }

    if (!moved) break
  }
}

function applyPositions(nodes: Node[], positions: Map<string, Point>, boxes: Map<string, NodeBox>): Node[] {
  return nodes.map((node) => {
    const box = boxes.get(node.id) ?? getNodeLayoutBox(node, node.id)
    const positioned = positions.get(node.id) ?? centerOf(node, box)

    return {
      ...node,
      position: {
        x: positioned.x - box.width / 2,
        y: positioned.y - box.height / 2,
      },
    }
  })
}

function layoutTopLayer(nodes: Node[], edges: Edge[], centerId: string): Node[] {
  if (nodes.length <= 3) {
    return layoutTopLayerPillars(nodes, centerId)
  }

  return layoutOverviewRadial(nodes, edges, centerId)
}

function layoutTopLayerPillars(nodes: Node[], centerId: string): Node[] {
  const boxes = new Map(nodes.map((node) => [node.id, getNodeLayoutBox(node, centerId)]))
  const centerNode = nodes.find((node) => node.id === centerId)
  const centerBox = centerNode ? boxes.get(centerId) ?? getNodeLayoutBox(centerNode, centerId) : null
  const centerPoint = centerNode && centerBox ? centerOf(centerNode, centerBox) : { x: 0, y: 0 }
  const positions = new Map<string, Point>()

  nodes.forEach((node) => {
    if (node.id === centerId) {
      positions.set(node.id, centerPoint)
      return
    }

    if (node.id === 'frontend') {
      positions.set(node.id, { x: centerPoint.x - TOP_LAYER_SPREAD, y: centerPoint.y })
      return
    }

    if (node.id === 'backend') {
      positions.set(node.id, { x: centerPoint.x + TOP_LAYER_SPREAD, y: centerPoint.y })
      return
    }

    positions.set(node.id, centerOf(node, boxes.get(node.id) ?? getNodeLayoutBox(node, centerId)))
  })

  return applyPositions(nodes, positions, boxes)
}

function buildAdjacency(edges: Edge[]): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>()

  const link = (a: string, b: string) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set())
    adjacency.get(a)!.add(b)
  }

  for (const edge of edges) {
    link(edge.source, edge.target)
    link(edge.target, edge.source)
  }

  return adjacency
}

function ringDepths(centerId: string, nodeIds: string[], adjacency: Map<string, Set<string>>): Map<string, number> {
  const depths = new Map<string, number>()
  depths.set(centerId, 0)

  const queue = [centerId]

  while (queue.length > 0) {
    const current = queue.shift()!
    const nextDepth = (depths.get(current) ?? 0) + 1
    const neighbors = adjacency.get(current) ?? new Set<string>()

    for (const neighbor of neighbors) {
      if (depths.has(neighbor)) continue
      depths.set(neighbor, nextDepth)
      queue.push(neighbor)
    }
  }

  for (const id of nodeIds) {
    if (!depths.has(id)) {
      depths.set(id, 1)
    }
  }

  return depths
}

function orderRingNodeIds(ids: string[]): string[] {
  const others = sortRingNodeIds(ids.filter((id) => id !== 'frontend' && id !== 'backend'))
  const hasFrontend = ids.includes('frontend')
  const hasBackend = ids.includes('backend')

  if (!hasFrontend && !hasBackend) {
    return others
  }

  const ordered: string[] = []
  if (hasFrontend) ordered.push('frontend')

  const splitAt = Math.ceil(others.length / 2)
  ordered.push(...others.slice(0, splitAt))

  if (hasBackend) ordered.push('backend')

  ordered.push(...others.slice(splitAt))
  return ordered
}

function sortRingNodeIds(ids: string[]): string[] {
  const priority = ['frontend', 'backend', 'users', 'architecture', 'constraints']

  return [...ids].sort((a, b) => {
    const pa = priority.indexOf(a)
    const pb = priority.indexOf(b)
    if (pa !== -1 || pb !== -1) {
      return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb)
    }
    return a.localeCompare(b)
  })
}


function layoutOverviewRadial(nodes: Node[], edges: Edge[], centerId: string): Node[] {
  const boxes = new Map(nodes.map((node) => [node.id, getNodeLayoutBox(node, centerId)]))
  const centerNode = nodes.find((node) => node.id === centerId)
  const centerBox = centerNode ? boxes.get(centerId) ?? getNodeLayoutBox(centerNode, centerId) : null
  const centerPoint: Point = { x: 0, y: 0 }
  const positions = new Map<string, Point>([[centerId, centerPoint]])

  const adjacency = buildAdjacency(edges)
  const depths = ringDepths(centerId, nodes.map((node) => node.id), adjacency)

  const rings = new Map<number, string[]>()
  for (const node of nodes) {
    if (node.id === centerId) continue
    const depth = depths.get(node.id) ?? 1
    const ring = rings.get(depth) ?? []
    ring.push(node.id)
    rings.set(depth, ring)
  }

  const sortedRingDepths = [...rings.keys()].sort((a, b) => a - b)

  for (const depth of sortedRingDepths) {
    const ringIds = orderRingNodeIds(rings.get(depth) ?? [])
    const ringRadius = DEFAULT_RING_RADIUS + (depth - 1) * RING_STEP
    const ringAngles = assignRingAngles(ringIds)

    for (const id of ringIds) {
      const box = boxes.get(id) ?? getNodeLayoutBox({ id } as Node, centerId)
      const angle = ringAngles.get(id) ?? 0
      const direction = { x: Math.cos(angle), y: Math.sin(angle) }
      const distance =
        centerBox !== null
          ? Math.max(ringRadius, radialDistance(centerBox, box, direction))
          : ringRadius

      positions.set(id, {
        x: centerPoint.x + direction.x * distance,
        y: centerPoint.y + direction.y * distance,
      })
    }
  }

  resolveCollisions(positions, boxes, centerId)

  return applyPositions(nodes, positions, boxes)
}

function layoutDetailRing(nodes: Node[], edges: Edge[], focusId: string): Node[] {
  const centerNode = nodes.find((node) => node.id === focusId)

  if (!centerNode) {
    return nodes
  }

  const boxes = new Map(nodes.map((node) => [node.id, getNodeLayoutBox(node, focusId)]))
  const centerBox = boxes.get(focusId) ?? getNodeLayoutBox(centerNode, focusId)
  const centerPoint = centerOf(centerNode, centerBox)
  const focusNeighborIds = new Set(
    edges
      .filter((edge) => edge.source === focusId || edge.target === focusId)
      .map((edge) => (edge.source === focusId ? edge.target : edge.source)),
  )
  const focusNeighbors = nodes.filter((node) => focusNeighborIds.has(node.id))
  const positions = new Map<string, Point>([[focusId, centerPoint]])

  focusNeighbors.forEach((node, index) => {
    const box = boxes.get(node.id) ?? getNodeLayoutBox(node, focusId)
    const currentCenter = centerOf(node, box)
    const fallback = fallbackDirection(index, focusNeighbors.length)
    const direction = normalizedDirection(
      {
        x: currentCenter.x - centerPoint.x,
        y: currentCenter.y - centerPoint.y,
      },
      fallback,
    )
    const distance = radialDistance(centerBox, box, direction)

    positions.set(node.id, {
      x: centerPoint.x + direction.x * distance,
      y: centerPoint.y + direction.y * distance,
    })
  })

  const remainingNodes = nodes.filter((node) => node.id !== focusId && !focusNeighborIds.has(node.id))

  remainingNodes.forEach((node, index) => {
    const fallback = fallbackDirection(index + focusNeighbors.length, remainingNodes.length + focusNeighbors.length)

    positions.set(node.id, {
      x: centerPoint.x + fallback.x * (DEFAULT_RING_RADIUS * 1.35),
      y: centerPoint.y + fallback.y * (DEFAULT_RING_RADIUS * 1.35),
    })
  })

  resolveCollisions(positions, boxes, focusId)

  return applyPositions(nodes, positions, boxes)
}

export function layoutNodes(
  nodes: Node[],
  edges: Edge[],
  centerId: string,
  viewMode: CanvasViewMode = 'top',
  focusId: string | null = null,
): Node[] {
  if (viewMode === 'top') {
    return layoutTopLayer(nodes, edges, centerId)
  }

  if (focusId) {
    return layoutDetailRing(nodes, edges, focusId)
  }

  return layoutTopLayer(nodes, edges, centerId)
}
