import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'

export type LabeledEdgeData = {
  label?: string
  isPreview?: boolean
}

export default function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
}: EdgeProps) {
  const edgeData = (data ?? {}) as LabeledEdgeData
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: edgeData.isPreview ? '#60a5fa' : '#4b5563',
          strokeDasharray: edgeData.isPreview ? '6 4' : undefined,
        }}
      />
      {edgeData.label && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute rounded bg-[#1a1d27] px-1.5 py-0.5 text-[10px] text-[#9aa3b2]"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {edgeData.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
