import { Handle, Position, type NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import type { CSSProperties } from 'react'
import type { Card } from '../../../types/canvas'
import { cardJiggleDelay } from '../../../lib/canDeleteCard'
import {
  cardTypeLabel,
  cardTypeStyles,
  cardTypeLabelStyles,
  cardTypeHandleStyles,
  cardSelectedStyles,
} from '../../../lib/cardStyles'
import { useLongPress } from '../../../hooks/useLongPress'
import { useCanvasStore } from '../../../store/canvasStore'
import VizEmbed from '../../viz/VizEmbed'

export type CardNodeData = {
  card: Card
  isPreview?: boolean
  isCurrentPreviewCard?: boolean
}

const handlePositions = [Position.Top, Position.Right, Position.Bottom, Position.Left]

export default function CardNode({ data }: NodeProps) {
  const nodeData = data as CardNodeData
  const { card, isPreview, isCurrentPreviewCard } = nodeData
  const hasInteractiveViz = card.vizType === 'progress-checklist'
  const isSelected = useCanvasStore((state) => state.selectedCardId === card.id)
  const isDeleteMode = useCanvasStore((state) => state.isDeleteMode)
  const toggleSelectCard = useCanvasStore((state) => state.toggleSelectCard)
  const drillTopLayerCard = useCanvasStore((state) => state.drillTopLayerCard)
  const enterDeleteMode = useCanvasStore((state) => state.enterDeleteMode)

  const longPress = useLongPress(enterDeleteMode, { disabled: isDeleteMode })

  return (
    <div
      role="button"
      tabIndex={0}
      style={
        isDeleteMode
          ? ({ '--card-jiggle-delay': `${cardJiggleDelay(card.id)}ms` } as CSSProperties)
          : undefined
      }
      onClick={(event) => {
        if (longPress.consumeClick()) return
        if (isDeleteMode) return
        if (event.detail === 2) return
        toggleSelectCard(card.id)
      }}
      onDoubleClick={(event) => {
        if (isDeleteMode) return
        event.stopPropagation()
        drillTopLayerCard(card.id)
      }}
      onKeyDown={(event) => {
        if (isDeleteMode) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          toggleSelectCard(card.id)
        }
      }}
      onPointerDown={longPress.onPointerDown}
      onPointerUp={longPress.onPointerUp}
      onPointerLeave={longPress.onPointerLeave}
      onPointerCancel={longPress.onPointerCancel}
      className={clsx(
        'canvas-node-card cursor-pointer rounded-2xl border px-3 py-2.5 text-left transition-[opacity,box-shadow,border-color,filter,transform,ring-color]',
        hasInteractiveViz ? 'w-[300px]' : 'w-[260px]',
        cardTypeStyles(card.type),
        isPreview && 'canvas-node-card--preview',
        isCurrentPreviewCard && 'canvas-node-card--current-preview',
        isSelected && !isDeleteMode && cardSelectedStyles(card.type),
        isDeleteMode && 'canvas-node-card--jiggle',
      )}
    >
      {handlePositions.map((position) => (
        <Handle
          key={`target-${position}`}
          id={`target-${position}`}
          type="target"
          position={position}
          className={clsx('!h-1.5 !w-1.5', cardTypeHandleStyles(card.type))}
        />
      ))}
      {handlePositions.map((position) => (
        <Handle
          key={`source-${position}`}
          id={`source-${position}`}
          type="source"
          position={position}
          className={clsx('!h-1.5 !w-1.5', cardTypeHandleStyles(card.type))}
        />
      ))}
      <div className="w-full text-left">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span
            className={clsx(
              'text-[10px] font-semibold uppercase tracking-wide',
              cardTypeLabelStyles(card.type),
            )}
          >
            {cardTypeLabel(card.type)}
          </span>
          {card.status && (
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-stone-700">
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
          <p className="line-clamp-2 text-xs leading-relaxed text-stone-700">{card.body}</p>
        )}
      </div>
      {hasInteractiveViz && (
        <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-stone-700">{card.body}</p>
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
