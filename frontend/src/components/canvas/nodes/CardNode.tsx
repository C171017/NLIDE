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
  const hasInteractiveViz = card.vizType === 'progress-checklist'

  return (
    <div
      className={clsx(
        'rounded-2xl border px-3 py-2.5 text-left shadow-xl shadow-black/20 backdrop-blur-xl transition-colors',
        hasInteractiveViz ? 'w-[300px]' : 'w-[260px]',
        cardTypeStyles(card.type),
        isPreview && 'border-dashed opacity-80',
        isSelected && 'ring-2 ring-sky-300/70',
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
      <button
        type="button"
        onClick={() => onSelect?.(card.id)}
        className="w-full text-left"
      >
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-[#9aa3b2]">
            {cardTypeLabel(card.type)}
          </span>
          {card.status && (
            <span className="rounded-full bg-slate-950/45 px-2 py-0.5 text-[10px] text-[#b8c0cf]">
              {card.status.replace('_', ' ')}
            </span>
          )}
          {isPreview && (
            <span className="rounded-full bg-sky-400/20 px-2 py-0.5 text-[10px] text-sky-200">
              preview
            </span>
          )}
        </div>
        <h3 className="mb-1 text-sm font-semibold text-[#f3f4f6]">{card.title}</h3>
        {!hasInteractiveViz && (
          <p className="line-clamp-2 text-xs leading-relaxed text-[#b6bcc8]">{card.body}</p>
        )}
      </button>
      {hasInteractiveViz && (
        <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-[#b6bcc8]">{card.body}</p>
      )}
      {card.vizType && card.vizPayload !== undefined && (
        <div
          className={clsx('nodrag nopan nowheel mt-2', hasInteractiveViz && '-mx-1')}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <VizEmbed vizType={card.vizType} payload={card.vizPayload} compact={hasInteractiveViz} />
        </div>
      )}
    </div>
  )
}
