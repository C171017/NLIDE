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

const TYPE_SELECTED: Record<CardType, string> = {
  index:
    'ring-2 ring-amber-400/80 ring-offset-2 ring-offset-[#0b0d12] border-amber-300/70 shadow-lg shadow-amber-500/25',
  product:
    'ring-2 ring-amber-400/80 ring-offset-2 ring-offset-[#0b0d12] border-amber-300/70 shadow-lg shadow-amber-500/25',
  frontend:
    'ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-[#0b0d12] border-emerald-300/70 shadow-lg shadow-emerald-500/25',
  backend:
    'ring-2 ring-cyan-400/80 ring-offset-2 ring-offset-[#0b0d12] border-cyan-300/70 shadow-lg shadow-cyan-500/25',
  users:
    'ring-2 ring-violet-400/80 ring-offset-2 ring-offset-[#0b0d12] border-violet-300/70 shadow-lg shadow-violet-500/25',
  feature:
    'ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-[#0b0d12] border-emerald-300/70 shadow-lg shadow-emerald-500/25',
  task:
    'ring-2 ring-orange-400/80 ring-offset-2 ring-offset-[#0b0d12] border-orange-300/70 shadow-lg shadow-orange-500/25',
  architecture:
    'ring-2 ring-cyan-400/80 ring-offset-2 ring-offset-[#0b0d12] border-cyan-300/70 shadow-lg shadow-cyan-500/25',
  constraint:
    'ring-2 ring-rose-400/80 ring-offset-2 ring-offset-[#0b0d12] border-rose-300/70 shadow-lg shadow-rose-500/25',
  decision:
    'ring-2 ring-indigo-400/80 ring-offset-2 ring-offset-[#0b0d12] border-indigo-300/70 shadow-lg shadow-indigo-500/25',
  'open-question':
    'ring-2 ring-yellow-400/80 ring-offset-2 ring-offset-[#0b0d12] border-yellow-300/70 shadow-lg shadow-yellow-500/25',
}

export function cardSelectedStyles(type: CardType): string {
  return TYPE_SELECTED[type]
}
