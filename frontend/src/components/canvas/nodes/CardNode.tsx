import { Handle, Position, type NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import type { Card } from '../../../types/canvas'
import { cardTypeLabel, cardTypeStyles } from '../../../lib/cardStyles'
import VizEmbed from '../../viz/VizEmbed'

export type CardNodeData = {
  card: Card
  isPreview?: boolean
  isSelected?: boolean
  onSelect?: (cardId: string) => void
}

const handlePositions = [Position.Top, Position.Right, Position.Bottom, Position.Left]

export default function CardNode({ data }: NodeProps) {
  const nodeData = data as CardNodeData
  const { card, isPreview, isSelected, onSelect } = nodeData

  return (
    <button
      type="button"
      onClick={() => onSelect?.(card.id)}
      className={clsx(
        'w-[260px] rounded-xl border px-3 py-2.5 text-left transition-colors',
        cardTypeStyles(card.type),
        isPreview && 'border-dashed opacity-80',
        isSelected && 'ring-2 ring-sky-400/70',
      )}
    >
      {handlePositions.map((position) => (
        <Handle
          key={`target-${position}`}
          id={`target-${position}`}
          type="target"
          position={position}
          className="!h-1.5 !w-1.5 !bg-[#6b7280]"
        />
      ))}
      {handlePositions.map((position) => (
        <Handle
          key={`source-${position}`}
          id={`source-${position}`}
          type="source"
          position={position}
          className="!h-1.5 !w-1.5 !bg-[#6b7280]"
        />
      ))}
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-[#9aa3b2]">
          {cardTypeLabel(card.type)}
        </span>
        {card.status && (
          <span className="rounded-full bg-[#1a1d27] px-2 py-0.5 text-[10px] text-[#9aa3b2]">
            {card.status.replace('_', ' ')}
          </span>
        )}
        {isPreview && (
          <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-300">
            preview
          </span>
        )}
      </div>
      <h3 className="mb-1 text-sm font-semibold text-[#f3f4f6]">{card.title}</h3>
      <p className="line-clamp-2 text-xs leading-relaxed text-[#b6bcc8]">{card.body}</p>
      {card.vizType && card.vizPayload !== undefined && (
        <div className="mt-2">
          <VizEmbed vizType={card.vizType} payload={card.vizPayload} compact />
        </div>
      )}
    </button>
  )
}
