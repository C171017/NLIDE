import {
  formatRemainingWritersOrder,
  getWriterBriefByFile,
} from '../_shared/translator/index.ts'
import { callOpenRouterChat, isLlmConfigured } from '../lib/openRouter.ts'
import {
  allocateNextDecisionId,
  allocateNextOpenQuestionId,
  stripMarkdownFences,
  validateDocSection,
  validateEntitySection,
} from './schema.ts'
import { findOperation, type WriteRemainingInput, type WriteRemainingResult } from './types.ts'

const REMAINING_TARGETS = new Set([
  'constraints.md',
  'decisions.md',
  'open-questions.md',
  'product.md',
  'users.md',
  'architecture.md',
])

function buildRemainingWriterSystemPrompt(targetFile: string): string {
  const brief = getWriterBriefByFile(targetFile)
  if (!brief) {
    throw new Error(`No writer brief for ${targetFile}`)
  }

  return [
    `You are the NLIDE ${targetFile} writer. Produce markdown for this file only.`,
    'Return ONLY markdown — no JSON, no fences, no commentary.',
    '',
    formatRemainingWritersOrder(),
    '',
    `## Focus: ${targetFile}`,
    '### Required fields',
    ...brief.requiredFields.map((line) => `- ${line}`),
    '',
    '### Markdown template',
    brief.markdownTemplate,
    '',
    '### Add rules',
    ...brief.addRules.map((line) => `- ${line}`),
    '',
    '### Update rules',
    ...brief.updateRules.map((line) => `- ${line}`),
    '',
    '### Example',
    brief.example,
    '',
    'When focus_operation is set in the input, write only that entity from a compound message.',
  ].join('\n')
}

function resolveFileOperation(input: WriteRemainingInput) {
  return (
    input.focusOperation ??
    findOperation(input.routerPlan, input.targetFile)
  )
}

function buildUserPayload(input: WriteRemainingInput): Record<string, unknown> {
  const op = resolveFileOperation(input)
  if (!op) {
    throw new Error(`No ${input.targetFile} operation in router plan`)
  }

  const existingIds = input.existingEntityIds ?? []
  let allocatedId: string | undefined

  if (op.action === 'add') {
    if (op.entity_id) {
      allocatedId = op.entity_id
    } else if (input.targetFile === 'decisions.md') {
      allocatedId = allocateNextDecisionId(existingIds)
    } else if (input.targetFile === 'open-questions.md') {
      allocatedId = allocateNextOpenQuestionId(existingIds)
    }
  }

  return {
    user_message: input.userMessage,
    router_plan: input.routerPlan,
    target_file: input.targetFile,
    focus_operation: op,
    compound_index: input.compoundIndex ?? null,
    existing_entity_ids: existingIds,
    allocated_entity_id: allocatedId,
    existing_content: input.existingContent ?? null,
    open_questions: input.routerPlan.open_questions ?? [],
  }
}

function validateRemainingOutput(
  section: string,
  input: WriteRemainingInput,
): { ok: true; entityId?: string } | { ok: false; code: string; message: string; issues: string[] } {
  const op = resolveFileOperation(input)!
  const existingIds = input.existingEntityIds ?? []

  if (input.targetFile === 'decisions.md') {
    const allocatedId =
      op.action === 'add'
        ? op.entity_id ?? allocateNextDecisionId(existingIds)
        : undefined
    const result = validateEntitySection(section, 'decisions.md', {
      action: op.action,
      idPrefix: 'D',
      expectedEntityId: op.action === 'update' ? op.entity_id : undefined,
      allocatedEntityId: allocatedId,
    })
    if (!result.ok) {
      return { ok: false, code: result.code, message: result.message, issues: result.issues }
    }
    return { ok: true, entityId: result.entityId }
  }

  if (input.targetFile === 'open-questions.md') {
    const allocatedId =
      op.action === 'add'
        ? op.entity_id ?? allocateNextOpenQuestionId(existingIds)
        : undefined
    const result = validateEntitySection(section, 'open-questions.md', {
      action: op.action,
      idPrefix: 'OQ',
      expectedEntityId: op.action === 'update' ? op.entity_id : undefined,
      allocatedEntityId: allocatedId,
    })
    if (!result.ok) {
      return { ok: false, code: result.code, message: result.message, issues: result.issues }
    }
    return { ok: true, entityId: result.entityId }
  }

  const docResult = validateDocSection(section, input.targetFile)
  if (!docResult.ok) {
    return {
      ok: false,
      code: docResult.code,
      message: docResult.message,
      issues: docResult.issues,
    }
  }

  return { ok: true }
}

/** Write one remaining spec file section from router plan. Phase 4 implementation. */
export async function writeRemainingSection(
  input: WriteRemainingInput,
): Promise<WriteRemainingResult> {
  if (!isLlmConfigured()) {
    return {
      ok: false,
      error: {
        code: 'writer_unconfigured',
        message: 'OPENROUTER_API_KEY is not set on nlide-api function secrets',
      },
    }
  }

  if (!REMAINING_TARGETS.has(input.targetFile)) {
    return {
      ok: false,
      error: {
        code: 'writer_invalid_target',
        message: `${input.targetFile} is not a remaining writer target`,
      },
    }
  }

  const op = resolveFileOperation(input)
  if (!op) {
    return {
      ok: false,
      error: {
        code: 'writer_no_file_op',
        message: `Router plan has no ${input.targetFile} operation`,
      },
    }
  }

  let llm: { content: string; model: string }
  try {
    llm = await callOpenRouterChat({
      systemPrompt: buildRemainingWriterSystemPrompt(input.targetFile),
      userContent:
        `Write the ${input.targetFile} content for this input. Return ONLY markdown.\n\n` +
        JSON.stringify(buildUserPayload(input), null, 2),
      title: `NLIDE ${input.targetFile} Writer`,
      role: 'writer',
      maxTokens: 1800,
    })
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'writer_upstream_error',
        message: error instanceof Error ? error.message : 'Remaining writer LLM call failed',
      },
    }
  }

  const section = stripMarkdownFences(llm.content)
  const validated = validateRemainingOutput(section, input)

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
    targetFile: input.targetFile,
    entityId: validated.entityId,
    action: op.action,
    model: llm.model,
  }
}
