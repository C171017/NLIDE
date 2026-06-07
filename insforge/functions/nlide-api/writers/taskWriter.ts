import { formatTaskWriterRules } from '../_shared/translator/index.ts'
import { callOpenRouterChat, isLlmConfigured } from '../lib/openRouter.ts'
import {
  allocateNextTaskId,
  stripMarkdownFences,
  validateTaskSection,
} from './schema.ts'
import { findTasksOperation, type WriteTaskInput, type WriteTaskResult } from './types.ts'

function buildTaskWriterSystemPrompt(): string {
  return [
    'You are the NLIDE tasks.md writer. Given a user message and router plan, produce ONE task section in markdown.',
    'Return ONLY the markdown section — no JSON, no fences, no commentary.',
    '',
    formatTaskWriterRules(),
    '',
    '## Output rules',
    '- Match the markdown template exactly (heading, Feature, Status, Instructions for agent, Done when).',
    '- On update: preserve task ID; update status/instructions when user asks (e.g. mark done).',
    '- On add: use allocated task ID and link to the paired feature ID when provided.',
    '- When focus_operation is set, write only that task from a compound message.',
    '- Numbered instructions at intent level — no file paths as primary content.',
  ].join('\n')
}

function resolveTasksOperation(input: WriteTaskInput) {
  return input.focusOperation ?? findTasksOperation(input.routerPlan)
}

function buildUserPayload(input: WriteTaskInput): string {
  const tasksOp = resolveTasksOperation(input)
  if (!tasksOp) {
    throw new Error('No tasks.md operation in router plan')
  }

  const existingIds = input.existingTaskIds ?? []
  const allocatedId =
    tasksOp.action === 'add'
      ? tasksOp.entity_id ?? allocateNextTaskId(existingIds)
      : undefined

  return JSON.stringify(
    {
      user_message: input.userMessage,
      router_plan: input.routerPlan,
      focus_operation: tasksOp,
      compound_index: input.compoundIndex ?? null,
      existing_task_ids: existingIds,
      allocated_task_id: allocatedId,
      linked_feature_id: input.linkedFeatureId ?? null,
      existing_section: input.existingSection ?? null,
    },
    null,
    2,
  )
}

/** Write one tasks.md section from router plan + user message. Phase 4 implementation. */
export async function writeTaskSection(input: WriteTaskInput): Promise<WriteTaskResult> {
  if (!isLlmConfigured()) {
    return {
      ok: false,
      error: {
        code: 'writer_unconfigured',
        message: 'OPENROUTER_API_KEY is not set on nlide-api function secrets',
      },
    }
  }

  const tasksOp = resolveTasksOperation(input)
  if (!tasksOp) {
    return {
      ok: false,
      error: {
        code: 'writer_no_tasks_op',
        message: 'Router plan has no tasks.md operation — task writer not applicable',
      },
    }
  }

  const existingIds = input.existingTaskIds ?? []
  const allocatedId =
    tasksOp.action === 'add'
      ? tasksOp.entity_id ?? allocateNextTaskId(existingIds)
      : undefined

  let llm: { content: string; model: string }
  try {
    llm = await callOpenRouterChat({
      systemPrompt: buildTaskWriterSystemPrompt(),
      userContent:
        'Write the tasks.md section for this input. Return ONLY markdown for one task section.\n\n' +
        buildUserPayload(input),
      title: 'NLIDE Task Writer',
      role: 'writer',
      maxTokens: 1500,
    })
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'writer_upstream_error',
        message: error instanceof Error ? error.message : 'Task writer LLM call failed',
      },
    }
  }

  const section = stripMarkdownFences(llm.content)
  const validated = validateTaskSection(section, {
    action: tasksOp.action,
    expectedEntityId:
      tasksOp.action === 'update'
        ? tasksOp.entity_id
        : tasksOp.entity_id ?? allocatedId,
    allocatedEntityId: allocatedId,
    linkedFeatureId: input.linkedFeatureId,
  })

  if (!validated.ok) {
    return {
      ok: false,
      error: {
        code: validated.code,
        message: validated.message,
        validationIssues: validated.issues,
      },
    }
  }

  return {
    ok: true,
    section,
    entityId: validated.entityId,
    featureId: validated.featureId,
    action: tasksOp.action,
    model: llm.model,
  }
}

export function isTaskWriterConfigured(): boolean {
  return isLlmConfigured()
}
