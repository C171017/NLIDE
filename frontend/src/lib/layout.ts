import type { Edge, Node } from '@xyflow/react'

const NODE_WIDTH = 260
const NODE_HEIGHT = 150
const INDEX_WIDTH = 300
const INDEX_HEIGHT = 260
const DEFAULT_RING_RADIUS = 420
const COLLISION_GAP = 48

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
  const isIndex = node.id === centerId

  if (isIndex) {
    return {
      id: node.id,
      width: INDEX_WIDTH,
      height: hasViz ? INDEX_HEIGHT : 170,
    }
  }

  return {
    id: node.id,
    width: NODE_WIDTH,
    height: hasViz ? 240 : NODE_HEIGHT,
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

export function layoutNodes(nodes: Node[], edges: Edge[], centerId: string): Node[] {
  const centerNode = nodes.find((node) => node.id === centerId)

  if (!centerNode) {
    return nodes
  }

  const boxes = new Map(nodes.map((node) => [node.id, getNodeLayoutBox(node, centerId)]))
  const centerBox = boxes.get(centerId) ?? getNodeLayoutBox(centerNode, centerId)
  const centerPoint = centerOf(centerNode, centerBox)
  const centerNeighborIds = new Set(
    edges
      .filter((edge) => edge.source === centerId || edge.target === centerId)
      .map((edge) => (edge.source === centerId ? edge.target : edge.source)),
  )
  const centerNeighbors = nodes.filter((node) => centerNeighborIds.has(node.id))
  const positions = new Map<string, Point>([[centerId, centerPoint]])

  centerNeighbors.forEach((node, index) => {
    const box = boxes.get(node.id) ?? getNodeLayoutBox(node, centerId)
    const currentCenter = centerOf(node, box)
    const fallback = fallbackDirection(index, centerNeighbors.length)
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

  const remainingNodes = nodes.filter((node) => node.id !== centerId && !centerNeighborIds.has(node.id))

  remainingNodes.forEach((node, index) => {
    const box = boxes.get(node.id) ?? getNodeLayoutBox(node, centerId)
    const currentCenter = centerOf(node, box)
    const fallback = fallbackDirection(index + centerNeighbors.length, remainingNodes.length + centerNeighbors.length)
    const direction = normalizedDirection(
      {
        x: currentCenter.x - centerPoint.x,
        y: currentCenter.y - centerPoint.y,
      },
      fallback,
    )

    positions.set(node.id, {
      x: centerPoint.x + direction.x * (DEFAULT_RING_RADIUS * 1.55),
      y: centerPoint.y + direction.y * (DEFAULT_RING_RADIUS * 1.55),
    })
  })

  resolveCollisions(positions, boxes, centerId)

  return nodes.map((node) => {
    const box = boxes.get(node.id) ?? getNodeLayoutBox(node, centerId)
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
