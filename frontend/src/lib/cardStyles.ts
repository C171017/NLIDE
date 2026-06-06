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
  index: 'border-amber-500/60 bg-amber-500/10',
  product: 'border-amber-500/70 bg-amber-500/15',
  frontend: 'border-emerald-500/50 bg-emerald-500/10',
  backend: 'border-cyan-500/50 bg-cyan-500/10',
  users: 'border-violet-500/50 bg-violet-500/10',
  feature: 'border-emerald-500/50 bg-emerald-500/10',
  task: 'border-orange-500/50 bg-orange-500/10',
  architecture: 'border-cyan-500/50 bg-cyan-500/10',
  constraint: 'border-rose-500/50 bg-rose-500/10',
  decision: 'border-indigo-500/50 bg-indigo-500/10',
  'open-question': 'border-yellow-500/50 bg-yellow-500/10',
}

export function cardTypeLabel(type: CardType): string {
  return TYPE_LABELS[type]
}

export function cardTypeStyles(type: CardType): string {
  return TYPE_COLORS[type]
}
