import type { InsForgeClient } from 'npm:@insforge/sdk@latest'
import type {
  ExecutionPlan,
  ExecutionPlanPreviewPayload,
  ExecutionPlanState,
  ExecutionPlanStoredPayload,
} from '../_shared/translator/executionPlanTypes.ts'

function parseStoredPayload(raw: unknown): ExecutionPlanStoredPayload {
  if (raw && typeof raw === 'object' && 'plan' in raw) {
    return raw as ExecutionPlanStoredPayload
  }
  return { plan: raw as ExecutionPlan }
}

export async function loadCommittedPlan(
  client: InsForgeClient,
  projectId: string,
): Promise<{ plan: ExecutionPlan | null; tasksMd: string | null }> {
  const { data, error } = await client.database
    .from('execution_plans')
    .select('payload')
    .eq('project_id', projectId)
    .maybeSingle()

  if (error) throw error
  if (!data?.payload) return { plan: null, tasksMd: null }

  const stored = parseStoredPayload(data.payload)
  return { plan: stored.plan, tasksMd: stored.tasksMd ?? null }
}

export async function loadExecutionPlanPreview(
  client: InsForgeClient,
  projectId: string,
): Promise<ExecutionPlanPreviewPayload | null> {
  const { data, error } = await client.database
    .from('execution_plan_previews')
    .select('id,payload')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const stored = parseStoredPayload(data.payload)
  return {
    previewId: data.id as string,
    plan: stored.plan,
    tasksMd: stored.tasksMd,
  }
}

export async function saveExecutionPlanPreview(
  client: InsForgeClient,
  projectId: string,
  previewId: string,
  plan: ExecutionPlan,
  tasksMd?: string,
): Promise<void> {
  const { error: deleteError } = await client.database
    .from('execution_plan_previews')
    .delete()
    .eq('project_id', projectId)

  if (deleteError) throw deleteError

  const payload: ExecutionPlanStoredPayload = { plan, tasksMd }

  const { error } = await client.database.from('execution_plan_previews').insert([
    {
      id: previewId,
      project_id: projectId,
      payload,
    },
  ])

  if (error) throw error
}

export async function commitExecutionPlan(
  client: InsForgeClient,
  projectId: string,
  previewId: string,
): Promise<{ plan: ExecutionPlan; tasksMd: string | null } | null> {
  const { data, error } = await client.database
    .from('execution_plan_previews')
    .select('payload')
    .eq('id', previewId)
    .eq('project_id', projectId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const stored = parseStoredPayload(data.payload)

  const { error: upsertError } = await client.database.from('execution_plans').upsert([
    {
      project_id: projectId,
      payload: stored,
      updated_at: new Date().toISOString(),
    },
  ])

  if (upsertError) throw upsertError

  const { error: deleteError } = await client.database
    .from('execution_plan_previews')
    .delete()
    .eq('id', previewId)

  if (deleteError) throw deleteError

  return { plan: stored.plan, tasksMd: stored.tasksMd ?? null }
}

export async function discardExecutionPlanPreview(
  client: InsForgeClient,
  previewId: string,
): Promise<boolean> {
  const { data, error } = await client.database
    .from('execution_plan_previews')
    .delete()
    .eq('id', previewId)
    .select('id')

  if (error) throw error
  return (data?.length ?? 0) > 0
}

export async function loadExecutionPlanState(
  client: InsForgeClient,
  projectId: string,
): Promise<ExecutionPlanState> {
  const [committed, preview] = await Promise.all([
    loadCommittedPlan(client, projectId),
    loadExecutionPlanPreview(client, projectId),
  ])

  return {
    committed: committed.plan,
    committedTasksMd: committed.tasksMd,
    preview,
  }
}
