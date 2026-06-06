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

/** Distinct border + semi-transparent tint per type; text stays stone-900/700 on cards. */
const TYPE_COLORS: Record<CardType, string> = {
  index: 'border-amber-400/70 bg-amber-100/55 shadow-md shadow-amber-200/45',
  product: 'border-amber-500/70 bg-amber-100/55 shadow-md shadow-amber-200/45',
  frontend: 'border-emerald-500/65 bg-emerald-100/50 shadow-md shadow-emerald-200/40',
  backend: 'border-sky-500/65 bg-sky-100/50 shadow-md shadow-sky-200/40',
  users: 'border-violet-500/65 bg-violet-100/50 shadow-md shadow-violet-200/40',
  feature: 'border-teal-500/65 bg-teal-100/50 shadow-md shadow-teal-200/40',
  task: 'border-orange-500/65 bg-orange-100/50 shadow-md shadow-orange-200/40',
  architecture: 'border-blue-500/65 bg-blue-100/50 shadow-md shadow-blue-200/40',
  constraint: 'border-rose-500/65 bg-rose-100/50 shadow-md shadow-rose-200/40',
  decision: 'border-indigo-500/65 bg-indigo-100/50 shadow-md shadow-indigo-200/40',
  'open-question': 'border-yellow-500/65 bg-yellow-100/50 shadow-md shadow-yellow-200/40',
}

const TYPE_LABEL_COLORS: Record<CardType, string> = {
  index: 'text-amber-800',
  product: 'text-amber-800',
  frontend: 'text-emerald-800',
  backend: 'text-sky-800',
  users: 'text-violet-800',
  feature: 'text-teal-800',
  task: 'text-orange-800',
  architecture: 'text-blue-800',
  constraint: 'text-rose-800',
  decision: 'text-indigo-800',
  'open-question': 'text-yellow-800',
}

const TYPE_HANDLE_COLORS: Record<CardType, string> = {
  index: '!bg-amber-500',
  product: '!bg-amber-500',
  frontend: '!bg-emerald-500',
  backend: '!bg-sky-500',
  users: '!bg-violet-500',
  feature: '!bg-teal-500',
  task: '!bg-orange-500',
  architecture: '!bg-blue-500',
  constraint: '!bg-rose-500',
  decision: '!bg-indigo-500',
  'open-question': '!bg-yellow-500',
}

export function cardTypeLabel(type: CardType): string {
  return TYPE_LABELS[type]
}

export function cardTypeStyles(type: CardType): string {
  return TYPE_COLORS[type]
}

export function cardTypeLabelStyles(type: CardType): string {
  return TYPE_LABEL_COLORS[type]
}

export function cardTypeHandleStyles(type: CardType): string {
  return TYPE_HANDLE_COLORS[type]
}

const TYPE_SELECTED: Record<CardType, string> = {
  index:
    'ring-2 ring-amber-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-amber-500/80 shadow-lg shadow-amber-500/25',
  product:
    'ring-2 ring-amber-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-amber-500/80 shadow-lg shadow-amber-500/25',
  frontend:
    'ring-2 ring-emerald-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-emerald-500/80 shadow-lg shadow-emerald-500/25',
  backend:
    'ring-2 ring-sky-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-sky-500/80 shadow-lg shadow-sky-500/25',
  users:
    'ring-2 ring-violet-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-violet-500/80 shadow-lg shadow-violet-500/25',
  feature:
    'ring-2 ring-teal-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-teal-500/80 shadow-lg shadow-teal-500/25',
  task:
    'ring-2 ring-orange-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-orange-500/80 shadow-lg shadow-orange-500/25',
  architecture:
    'ring-2 ring-blue-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-blue-500/80 shadow-lg shadow-blue-500/25',
  constraint:
    'ring-2 ring-rose-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-rose-500/80 shadow-lg shadow-rose-500/25',
  decision:
    'ring-2 ring-indigo-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-indigo-500/80 shadow-lg shadow-indigo-500/25',
  'open-question':
    'ring-2 ring-yellow-500/75 ring-offset-2 ring-offset-[var(--canvas-paper)] border-yellow-500/80 shadow-lg shadow-yellow-500/25',
}

export function cardSelectedStyles(type: CardType): string {
  return TYPE_SELECTED[type]
}
