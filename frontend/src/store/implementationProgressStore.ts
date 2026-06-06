import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export function isItemDone(
  completed: Record<string, Record<string, boolean>>,
  checklistId: string,
  itemId: string,
): boolean {
  return completed[checklistId]?.[itemId] ?? false
}

export function countDone(
  completed: Record<string, Record<string, boolean>>,
  checklistId: string,
  itemIds: string[],
): number {
  return itemIds.filter((id) => isItemDone(completed, checklistId, id)).length
}

interface ImplementationProgressStore {
  activePlanVersion: string | null
  completed: Record<string, Record<string, boolean>>
  toggleItem: (checklistId: string, itemId: string) => void
  resetForPlan: (planVersion: string) => void
}

export const useImplementationProgressStore = create<ImplementationProgressStore>()(
  persist(
    (set, get) => ({
      activePlanVersion: null,
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

      resetForPlan: (planVersion) => {
        if (get().activePlanVersion === planVersion) return
        set({
          activePlanVersion: planVersion,
          completed: {},
        })
      },
    }),
    { name: 'nlide-implementation-progress' },
  ),
)
