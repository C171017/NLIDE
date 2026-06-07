import type { CardSynthesisBundle } from '../_shared/translator/cardSynthesis.ts'
import { buildCardSynthesis } from '../_shared/translator/cardSynthesis.ts'
import {
  EXECUTION_PLANNER_SYSTEM_PROMPT,
  formatExecutionPlannerUserPayload,
} from '../_shared/translator/executionPlannerPrompt.ts'
import { EXECUTION_PLAN_VERSION, type ExecutionPlan } from '../_shared/translator/executionPlanTypes.ts'
import { ExecutionPlanLlmSchema } from './executionPlanSchema.ts'
import { validateExecutionPlan } from '../_shared/translator/validateExecutionPlan.ts'
import { callOpenRouterChat, isLlmConfigured } from '../lib/openRouter.ts'

export type BuildExecutionPlanResult =
  | {
      ok: true
      plan: ExecutionPlan
      model: string
      tasksMd: string
      warnings?: Array<{ ruleId: string; message: string }>
    }
  | {
      ok: false
      code: string
      message: string
      issues?: Array<{ ruleId: string; message: string }>
      zodIssues?: Array<{ path: string; message: string }>
    }

function parseLlmJson(content: string): unknown {
  const trimmed = content.trim()
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonText = fenceMatch ? fenceMatch[1].trim() : trimmed
  return JSON.parse(jsonText)
}

export function isExecutionPlannerConfigured(): boolean {
  return isLlmConfigured()
}

export async function buildExecutionPlan(input: {
  spec: Record<string, string>
  synthesis: CardSynthesisBundle
  projectName?: string
}): Promise<BuildExecutionPlanResult> {
  const tasksMd = input.spec['tasks.md'] ?? ''

  if (!isLlmConfigured()) {
    return {
      ok: false,
      code: 'execution_planner_unconfigured',
      message:
        'OPENROUTER_API_KEY is not set on nlide-api — run insforge secrets add OPENROUTER_API_KEY',
    }
  }

  try {
    const { content, model } = await callOpenRouterChat({
      systemPrompt: EXECUTION_PLANNER_SYSTEM_PROMPT,
      userContent: formatExecutionPlannerUserPayload({
        spec: input.spec,
        synthesis: input.synthesis,
        projectName: input.projectName,
      }),
      title: 'NLIDE Execution Planner',
      role: 'planner',
      jsonMode: true,
      maxTokens: 2400,
    })

    const raw = parseLlmJson(content)
    const parsed = ExecutionPlanLlmSchema.safeParse(raw)

    if (!parsed.success) {
      return {
        ok: false,
        code: 'execution_plan_parse_failed',
        message: 'LLM output did not match execution plan schema',
        zodIssues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      }
    }

    const plan: ExecutionPlan = {
      ...parsed.data,
      version: EXECUTION_PLAN_VERSION,
      planVersion: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      model,
    }

    const validation = validateExecutionPlan(plan, tasksMd)
    if (!validation.ok) {
      return {
        ok: false,
        code: 'execution_plan_validation_failed',
        message: 'Execution plan failed validation against tasks.md',
        issues: validation.issues,
      }
    }

    return { ok: true, plan, model, tasksMd, warnings: validation.warnings }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown planner error'
    return {
      ok: false,
      code: 'execution_plan_llm_failed',
      message,
    }
  }
}

/** Build synthesis from API card rows when client does not send cardSynthesis. */
export function synthesisFromApiCards(
  cards: Array<{
    id: string
    type: string
    title: string
    body: string
    specRef: { file: string; anchor?: string }
    status?: string
  }>,
): CardSynthesisBundle {
  return buildCardSynthesis(cards)
}
