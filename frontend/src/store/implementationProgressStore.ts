import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Jobs already satisfied — user approved or code shipped. */
export const DEFAULT_COMPLETED_JOBS: Record<string, Record<string, boolean>> = {
  'phase-0-preview-loop': {
    'preview-commit-ux': true,
  },
  'phase-1-router-contract': {
    'routing-policy': true,
    'intent-type-enum': true,
    'schema-fields': true,
    'spec-allowlist': true,
  },
}

export function isItemDone(
  completed: Record<string, Record<string, boolean>>,
  checklistId: string,
  itemId: string,
): boolean {
  const stored = completed[checklistId]?.[itemId]
  if (stored !== undefined) return stored
  return DEFAULT_COMPLETED_JOBS[checklistId]?.[itemId] ?? false
}

export function countDone(
  completed: Record<string, Record<string, boolean>>,
  checklistId: string,
  itemIds: string[],
): number {
  return itemIds.filter((id) => isItemDone(completed, checklistId, id)).length
}

interface ImplementationProgressStore {
  completed: Record<string, Record<string, boolean>>
  toggleItem: (checklistId: string, itemId: string) => void
}

export const useImplementationProgressStore = create<ImplementationProgressStore>()(
  persist(
    (set, get) => ({
      completed: {},

      toggleItem: (checklistId, itemId) => {
        const current = isItemDone(get().completed, checklistId, itemId)
        set((state) => ({
          completed: {
            ...state.completed,
            [checklistId]: {
              ...(state.completed[checklistId] ?? {}),
              [itemId]: !current,
            },
          },
        }))
      },
    }),
    { name: 'nlide-implementation-progress' },
  ),
)
