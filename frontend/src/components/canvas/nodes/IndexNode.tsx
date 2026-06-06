import { Handle, Position, type NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import type { Card } from '../../../types/canvas'
import VizEmbed from '../../viz/VizEmbed'

export type IndexNodeData = {
  card: Card
  isPreview?: boolean
  isSelected?: boolean
  onSelect?: (cardId: string) => void
}

export default function IndexNode({ data }: NodeProps) {
  const nodeData = data as IndexNodeData
  const { card, isPreview, isSelected, onSelect } = nodeData

  return (
    <button
      type="button"
      onClick={() => onSelect?.(card.id)}
      className={clsx(
        'w-[300px] rounded-2xl border border-amber-500/70 bg-amber-500/15 px-4 py-3 text-left',
        isPreview && 'border-dashed opacity-80',
        isSelected && 'ring-2 ring-amber-300/80',
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-amber-400" />
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/80">
        Index
      </div>
      <h2 className="mb-1 text-base font-semibold text-amber-50">{card.title}</h2>
      <p className="text-xs leading-relaxed text-amber-100/80">{card.body}</p>
      {card.vizType && card.vizPayload !== undefined && (
        <div className="mt-2">
          <VizEmbed vizType={card.vizType} payload={card.vizPayload} compact />
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-amber-400" />
    </button>
  )
}
