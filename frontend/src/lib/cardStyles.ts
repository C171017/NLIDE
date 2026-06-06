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
  index: 'border-amber-400/60 bg-amber-50/95',
  product: 'border-amber-400/60 bg-amber-50/95',
  frontend: 'border-emerald-500/50 bg-white',
  backend: 'border-cyan-500/50 bg-white',
  users: 'border-violet-500/50 bg-white',
  feature: 'border-emerald-500/50 bg-white',
  task: 'border-orange-500/50 bg-white',
  architecture: 'border-cyan-500/50 bg-white',
  constraint: 'border-rose-500/50 bg-white',
  decision: 'border-indigo-500/50 bg-white',
  'open-question': 'border-yellow-500/50 bg-white',
}

export function cardTypeLabel(type: CardType): string {
  return TYPE_LABELS[type]
}

export function cardTypeStyles(type: CardType): string {
  return TYPE_COLORS[type]
}

const TYPE_SELECTED: Record<CardType, string> = {
  index:
    'ring-2 ring-amber-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-amber-500/70 shadow-lg shadow-amber-500/20',
  product:
    'ring-2 ring-amber-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-amber-500/70 shadow-lg shadow-amber-500/20',
  frontend:
    'ring-2 ring-emerald-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-emerald-500/70 shadow-lg shadow-emerald-500/20',
  backend:
    'ring-2 ring-cyan-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-cyan-500/70 shadow-lg shadow-cyan-500/20',
  users:
    'ring-2 ring-violet-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-violet-500/70 shadow-lg shadow-violet-500/20',
  feature:
    'ring-2 ring-emerald-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-emerald-500/70 shadow-lg shadow-emerald-500/20',
  task:
    'ring-2 ring-orange-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-orange-500/70 shadow-lg shadow-orange-500/20',
  architecture:
    'ring-2 ring-cyan-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-cyan-500/70 shadow-lg shadow-cyan-500/20',
  constraint:
    'ring-2 ring-rose-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-rose-500/70 shadow-lg shadow-rose-500/20',
  decision:
    'ring-2 ring-indigo-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-indigo-500/70 shadow-lg shadow-indigo-500/20',
  'open-question':
    'ring-2 ring-yellow-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-yellow-500/70 shadow-lg shadow-yellow-500/20',
}

export function cardSelectedStyles(type: CardType): string {
  return TYPE_SELECTED[type]
}
