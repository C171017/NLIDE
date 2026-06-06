import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'

export type LabeledEdgeData = {
  label?: string
  isPreview?: boolean
  isSelected?: boolean
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

  const strokeColor = edgeData.isSelected
    ? '#2563eb'
    : edgeData.isPreview
      ? '#60a5fa'
      : '#4b5563'

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        interactionWidth={20}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: edgeData.isSelected ? 2.5 : undefined,
          strokeDasharray: edgeData.isPreview ? '6 4' : undefined,
        }}
      />
      {edgeData.label && (
        <EdgeLabelRenderer>
          <div
            className={
              edgeData.isSelected
                ? 'canvas-edge-label canvas-edge-label--selected pointer-events-none absolute rounded-full border px-1.5 py-0.5 text-[10px] shadow-sm'
                : 'canvas-edge-label pointer-events-none absolute rounded-full border border-stone-200 bg-white/95 px-1.5 py-0.5 text-[10px] text-stone-600 shadow-sm'
            }
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
