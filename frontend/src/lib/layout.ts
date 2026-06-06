import dagre from 'dagre'
import type { Edge, Node } from '@xyflow/react'

const NODE_WIDTH = 260
const NODE_HEIGHT = 120
const INDEX_WIDTH = 300
const INDEX_HEIGHT = 140

export function layoutNodes(nodes: Node[], edges: Edge[], centerId: string): Node[] {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 })

  for (const node of nodes) {
    const isIndex = node.id === centerId
    graph.setNode(node.id, {
      width: isIndex ? INDEX_WIDTH : NODE_WIDTH,
      height: isIndex ? INDEX_HEIGHT : NODE_HEIGHT,
    })
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target)
  }

  dagre.layout(graph)

  return nodes.map((node) => {
    const positioned = graph.node(node.id)
    const isIndex = node.id === centerId
    const width = isIndex ? INDEX_WIDTH : NODE_WIDTH
    const height = isIndex ? INDEX_HEIGHT : NODE_HEIGHT

    return {
      ...node,
      position: {
        x: positioned.x - width / 2,
        y: positioned.y - height / 2,
      },
    }
  })
}
