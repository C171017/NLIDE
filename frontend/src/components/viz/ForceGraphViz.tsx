import ForceGraph2D from 'react-force-graph-2d'

interface ForceGraphNode {
  id: string
  label: string
}

interface ForceGraphLink {
  source: string
  target: string
}

interface ForceGraphVizProps {
  data: unknown
  compact?: boolean
}

function parseData(data: unknown): { nodes: ForceGraphNode[]; links: ForceGraphLink[] } {
  if (!data || typeof data !== 'object') {
    return { nodes: [], links: [] }
  }

  const record = data as {
    nodes?: ForceGraphNode[]
    links?: ForceGraphLink[]
  }

  return {
    nodes: record.nodes ?? [],
    links: record.links ?? [],
  }
}

export default function ForceGraphViz({ data, compact = false }: ForceGraphVizProps) {
  const graph = parseData(data)

  return (
    <div
      className={`glass-surface overflow-hidden rounded-2xl ${compact ? 'h-36' : 'h-52'}`}
    >
      <ForceGraph2D
        graphData={graph}
        width={compact ? 240 : 320}
        height={compact ? 144 : 208}
        nodeLabel="label"
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = (node as ForceGraphNode).label
          const fontSize = 12 / globalScale
          ctx.font = `${fontSize}px Inter, sans-serif`
          ctx.fillStyle = '#e8eaed'
          ctx.fillText(label, (node.x ?? 0) - 20, (node.y ?? 0) + 4)
        }}
        linkColor={() => 'rgba(148, 163, 184, 0.62)'}
        backgroundColor="rgba(15, 23, 42, 0)"
      />
    </div>
  )
}
