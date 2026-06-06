import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  executionPlanToBuildPhases,
  type ExecutionPlan,
  type ExecutionPlanPreviewPayload,
  type ExecutionPlanState,
} from '@nlide/shared'
import { useCanvasStore } from '../store/canvasStore'
import { useImplementationProgressStore } from '../store/implementationProgressStore'
import {
  commitExecutionPlanRemote,
  discardExecutionPlanRemote,
  fetchExecutionPlan,
  isInsForgeConfigured,
  regenerateExecutionPlan,
} from '../lib/api'
import { assembleExecutionPlanInput } from '../lib/assembleExecutionPlanInput'
import { loadSpecProjectName } from '../lib/loadSpecCanvas'
import type { BuildPhase } from '@nlide/shared'

const LOCAL_COMMITTED_KEY = 'nlide-execution-plan-committed'
const LOCAL_PREVIEW_KEY = 'nlide-execution-plan-preview'

function readLocalState(): ExecutionPlanState {
  try {
    const committedRaw = localStorage.getItem(LOCAL_COMMITTED_KEY)
    const previewRaw = localStorage.getItem(LOCAL_PREVIEW_KEY)
    return {
      committed: committedRaw ? (JSON.parse(committedRaw) as ExecutionPlan) : null,
      preview: previewRaw ? (JSON.parse(previewRaw) as ExecutionPlanPreviewPayload) : null,
    }
  } catch {
    return { committed: null, preview: null }
  }
}

function writeLocalCommitted(plan: ExecutionPlan | null) {
  if (plan) {
    localStorage.setItem(LOCAL_COMMITTED_KEY, JSON.stringify(plan))
  } else {
    localStorage.removeItem(LOCAL_COMMITTED_KEY)
  }
}

function writeLocalPreview(preview: ExecutionPlanPreviewPayload | null) {
  if (preview) {
    localStorage.setItem(LOCAL_PREVIEW_KEY, JSON.stringify(preview))
  } else {
    localStorage.removeItem(LOCAL_PREVIEW_KEY)
  }
}

export type ExecutionSpecSource = 'postgres' | 'merged' | 'repo' | 'local'

export function useExecutionPlan() {
  const committedCards = useCanvasStore((state) => state.committedCards)
  const completed = useImplementationProgressStore((state) => state.completed)
  const resetForPlan = useImplementationProgressStore((state) => state.resetForPlan)

  const [committedPlan, setCommittedPlan] = useState<ExecutionPlan | null>(null)
  const [previewPlan, setPreviewPlan] = useState<ExecutionPlanPreviewPayload | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [specSource, setSpecSource] = useState<ExecutionSpecSource>('local')
  const [tasksMd, setTasksMd] = useState('')

  const loadState = useCallback(async () => {
    setIsBootstrapping(true)
    setError(null)
    try {
      if (isInsForgeConfigured()) {
        const state = await fetchExecutionPlan()
        setCommittedPlan(state.committed)
        setPreviewPlan(state.preview)
        if (state.committed) {
          resetForPlan(state.committed.planVersion)
        }
      } else {
        const state = readLocalState()
        setCommittedPlan(state.committed)
        setPreviewPlan(state.preview)
        if (state.committed) {
          resetForPlan(state.committed.planVersion)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load execution plan')
    } finally {
      setIsBootstrapping(false)
    }
  }, [resetForPlan])

  useEffect(() => {
    void loadState()
  }, [loadState])

  const activePlan = previewPlan?.plan ?? committedPlan

  useEffect(() => {
    if (tasksMd) return
    const projectName = loadSpecProjectName()
    const { input } = assembleExecutionPlanInput(committedCards, projectName)
    setTasksMd(input.spec['tasks.md'] ?? '')
  }, [committedCards, tasksMd])

  const phases: BuildPhase[] = useMemo(() => {
    if (!activePlan) return []
    return executionPlanToBuildPhases(activePlan, tasksMd, {
      isItemDone: (checklistId, itemId) => completed[checklistId]?.[itemId] ?? false,
    })
  }, [activePlan, tasksMd, completed])

  const regenerate = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const projectName = loadSpecProjectName()
      const { input, source } = assembleExecutionPlanInput(committedCards, projectName)
      setTasksMd(input.spec['tasks.md'] ?? '')

      if (!isInsForgeConfigured()) {
        throw new Error(
          'VITE_INSFORGE_FUNCTION_URL is not set — execution plan requires nlide-api + OPENROUTER_API_KEY',
        )
      }

      const result = await regenerateExecutionPlan({
        specBundle: input.spec,
        cardSynthesis: input.synthesis,
        projectName,
      })
      const preview: ExecutionPlanPreviewPayload = {
        previewId: result.previewId,
        plan: result.plan,
      }
      setPreviewPlan(preview)
      setSpecSource(result.specSource === 'postgres' ? 'postgres' : source)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regenerate failed')
    } finally {
      setIsLoading(false)
    }
  }, [committedCards])

  const commit = useCallback(async () => {
    if (!previewPlan) return
    setIsLoading(true)
    setError(null)

    try {
      if (isInsForgeConfigured()) {
        const plan = await commitExecutionPlanRemote(previewPlan.previewId)
        setCommittedPlan(plan)
        setPreviewPlan(null)
        resetForPlan(plan.planVersion)
      } else {
        setCommittedPlan(previewPlan.plan)
        writeLocalCommitted(previewPlan.plan)
        setPreviewPlan(null)
        writeLocalPreview(null)
        resetForPlan(previewPlan.plan.planVersion)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commit failed')
    } finally {
      setIsLoading(false)
    }
  }, [previewPlan, resetForPlan])

  const discard = useCallback(async () => {
    if (!previewPlan) return
    setIsLoading(true)
    setError(null)

    try {
      if (isInsForgeConfigured()) {
        await discardExecutionPlanRemote(previewPlan.previewId)
      } else {
        writeLocalPreview(null)
      }
      setPreviewPlan(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discard failed')
    } finally {
      setIsLoading(false)
    }
  }, [previewPlan])

  return {
    phases,
    committedPlan,
    previewPlan,
    activePlan,
    regenerate,
    commit,
    discard,
    isLoading,
    isBootstrapping,
    error,
    specSource,
    hasPlan: Boolean(activePlan),
    isPreview: Boolean(previewPlan),
  }
}
