import {
  formatAcceptanceCriteriaBar,
  formatFeaturesWriterTemplate,
} from '../_shared/translator/index.ts'
import { callOpenRouterChat, isLlmConfigured } from '../lib/openRouter.ts'
import {
  allocateNextFeatureId,
  stripMarkdownFences,
  validateFeatureSection,
} from './schema.ts'
import { findFeaturesOperation, type WriteFeaturesInput, type WriteFeaturesResult } from './types.ts'

function buildFeaturesWriterSystemPrompt(): string {
  return [
    'You are the NLIDE features.md writer. Given a user message and router plan, produce ONE feature section in markdown.',
    'Return ONLY the markdown section — no JSON, no fences, no commentary.',
    '',
    formatFeaturesWriterTemplate(),
    '',
    formatAcceptanceCriteriaBar(),
    '',
    '## Output rules',
    '- Match the markdown template exactly (heading, Status, Priority, Description, Acceptance criteria, Related).',
    '- On update: merge new acceptance criteria with existing unless user asks to replace; preserve feature ID.',
    '- On add: use the allocated feature ID provided in the input; default status proposed unless user approves.',
    '- When focus_operation is set, write only that feature from a compound message — ignore other asks.',
    '- Intent wording only — no React components, file paths, or npm packages as primary content.',
    '- Write testable acceptance criteria per the quality bar.',
  ].join('\n')
}

function resolveFeaturesOperation(input: WriteFeaturesInput) {
  return input.focusOperation ?? findFeaturesOperation(input.routerPlan)
}

function buildUserPayload(input: WriteFeaturesInput): string {
  const featuresOp = resolveFeaturesOperation(input)
  if (!featuresOp) {
    throw new Error('No features.md operation in router plan')
  }

  const existingIds = input.existingFeatureIds ?? []
  const allocatedId =
    featuresOp.action === 'add'
      ? featuresOp.entity_id ?? allocateNextFeatureId(existingIds)
      : undefined

  return JSON.stringify(
    {
      user_message: input.userMessage,
      router_plan: input.routerPlan,
      focus_operation: featuresOp,
      compound_index: input.compoundIndex ?? null,
      existing_feature_ids: existingIds,
      allocated_feature_id: allocatedId,
      existing_section: input.existingSection ?? null,
    },
    null,
    2,
  )
}

/** Write one features.md section from router plan + user message. Phase 3 implementation. */
export async function writeFeaturesSection(input: WriteFeaturesInput): Promise<WriteFeaturesResult> {
  if (!isLlmConfigured()) {
    return {
      ok: false,
      error: {
        code: 'writer_unconfigured',
        message: 'OPENROUTER_API_KEY is not set on nlide-api function secrets',
      },
    }
  }

  const featuresOp = resolveFeaturesOperation(input)
  if (!featuresOp) {
    return {
      ok: false,
      error: {
        code: 'writer_no_features_op',
        message: 'Router plan has no features.md operation — writer not applicable',
      },
    }
  }

  const existingIds = input.existingFeatureIds ?? []
  const allocatedId =
    featuresOp.action === 'add'
      ? featuresOp.entity_id ?? allocateNextFeatureId(existingIds)
      : undefined

  let llm: { content: string; model: string }
  try {
    llm = await callOpenRouterChat({
      systemPrompt: buildFeaturesWriterSystemPrompt(),
      userContent:
        'Write the features.md section for this input. Return ONLY markdown for one feature section.\n\n' +
        buildUserPayload(input),
      title: 'NLIDE Features Writer',
      maxTokens: 1500,
    })
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'writer_upstream_error',
        message: error instanceof Error ? error.message : 'Features writer LLM call failed',
      },
    }
  }

  const section = stripMarkdownFences(llm.content)
  const validated = validateFeatureSection(section, {
    action: featuresOp.action,
    expectedEntityId:
      featuresOp.action === 'update'
        ? featuresOp.entity_id
        : featuresOp.entity_id ?? allocatedId,
    allocatedEntityId: allocatedId,
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
    action: featuresOp.action,
    model: llm.model,
  }
}

export function isFeaturesWriterConfigured(): boolean {
  return isLlmConfigured()
}
