import { Handle, Position, type NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import type { Card } from '../../../types/canvas'
import { cardTypeLabel, cardTypeStyles, cardSelectedStyles } from '../../../lib/cardStyles'
import { useCanvasStore } from '../../../store/canvasStore'
import VizEmbed from '../../viz/VizEmbed'

export type CardNodeData = {
  card: Card
  isPreview?: boolean
}

const handlePositions = [Position.Top, Position.Right, Position.Bottom, Position.Left]

export default function CardNode({ data }: NodeProps) {
  const nodeData = data as CardNodeData
  const { card, isPreview } = nodeData
  const hasInteractiveViz = card.vizType === 'progress-checklist'
  const isSelected = useCanvasStore((state) => state.selectedCardId === card.id)
  const toggleSelectCard = useCanvasStore((state) => state.toggleSelectCard)
  const drillTopLayerCard = useCanvasStore((state) => state.drillTopLayerCard)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(event) => {
        if (event.detail === 2) return
        toggleSelectCard(card.id)
      }}
      onDoubleClick={(event) => {
        event.stopPropagation()
        drillTopLayerCard(card.id)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          toggleSelectCard(card.id)
        }
      }}
      className={clsx(
        'canvas-node-card cursor-pointer rounded-2xl border px-3 py-2.5 text-left shadow-md shadow-stone-300/40 transition-[opacity,box-shadow,border-color,filter,transform,ring-color]',
        hasInteractiveViz ? 'w-[300px]' : 'w-[260px]',
        cardTypeStyles(card.type),
        isPreview && 'border-dashed opacity-80',
        isSelected && cardSelectedStyles(card.type),
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
      <div className="w-full text-left">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
            {cardTypeLabel(card.type)}
          </span>
          {card.status && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
              {card.status.replace('_', ' ')}
            </span>
          )}
          {isPreview && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] text-sky-700">
              preview
            </span>
          )}
        </div>
        <h3 className="mb-1 text-sm font-semibold text-stone-900">{card.title}</h3>
        {!hasInteractiveViz && (
          <p className="line-clamp-2 text-xs leading-relaxed text-stone-600">{card.body}</p>
        )}
      </div>
      {hasInteractiveViz && (
        <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-stone-600">{card.body}</p>
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
