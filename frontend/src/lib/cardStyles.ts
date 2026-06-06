import type { CardType } from '../types/canvas'

const TYPE_LABELS: Record<CardType, string> = {
  index: 'Index',
  product: 'Product',
  frontend: 'Frontend',
  backend: 'Backend',
  users: 'Users',
  feature: 'Feature',
  task: 'Task',
  architecture: 'Architecture',
  constraint: 'Constraint',
  decision: 'Decision',
  'open-question': 'Open question',
}

const TYPE_COLORS: Record<CardType, string> = {
  index: 'border-amber-300/35 bg-amber-400/12',
  product: 'border-amber-300/35 bg-amber-400/12',
  frontend: 'border-emerald-300/35 bg-emerald-400/12',
  backend: 'border-cyan-300/35 bg-cyan-400/12',
  users: 'border-violet-300/35 bg-violet-400/12',
  feature: 'border-emerald-300/35 bg-emerald-400/12',
  task: 'border-orange-300/35 bg-orange-400/12',
  architecture: 'border-cyan-300/35 bg-cyan-400/12',
  constraint: 'border-rose-300/35 bg-rose-400/12',
  decision: 'border-indigo-300/35 bg-indigo-400/12',
  'open-question': 'border-yellow-300/35 bg-yellow-400/12',
}

export function cardTypeLabel(type: CardType): string {
  return TYPE_LABELS[type]
}

export function cardTypeStyles(type: CardType): string {
  return TYPE_COLORS[type]
}

export function cardSelectionStyles(
  isSelected: boolean,
  selectionActive: boolean,
  variant: 'default' | 'center' = 'default',
): string {
  if (isSelected) {
    if (variant === 'center') {
      return 'z-10 border-amber-200/80 ring-2 ring-amber-300 ring-offset-2 ring-offset-[#0f1219] shadow-lg shadow-amber-500/30'
    }

    return 'z-10 border-sky-300/70 ring-2 ring-sky-400 ring-offset-2 ring-offset-[#0f1219] shadow-lg shadow-sky-500/25'
  }

  if (selectionActive) {
    return 'opacity-55 saturate-[0.82]'
  }

  return ''
}
