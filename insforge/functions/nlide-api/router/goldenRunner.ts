import {
  evaluateGoldenRouterOutput,
  GOLDEN_PASS_BAR,
  GOLDEN_PROMPTS,
  scoreGoldenRouterResults,
} from '../_shared/translator/index.ts'
import { SMOKE_CONTEXT } from '../_shared/translator/routerSmokeInvoke.ts'
import { routeIntent } from './routeIntent.ts'
import type { RouterContext } from './types.ts'

export interface GoldenRouterRunResult {
  passCount: number
  total: number
  minPass: number
  passedBar: boolean
  results: Array<{
    promptId: string
    message: string
    pass: boolean
    failures: string[]
    plan?: unknown
    routerError?: string
  }>
}

/** Run all golden router prompts through routeIntent and score. */
export async function runGoldenRouterTests(
  context: RouterContext = SMOKE_CONTEXT as RouterContext,
): Promise<GoldenRouterRunResult> {
  const scored = []

  for (const golden of GOLDEN_PROMPTS) {
    const route = await routeIntent({ message: golden.message, context })

    if (!route.ok) {
      scored.push({
        promptId: golden.id,
        message: golden.message,
        pass: false,
        failures: [`router error: ${route.error.code} — ${route.error.message}`],
        routerError: route.error.message,
      })
      continue
    }

    const match = evaluateGoldenRouterOutput(route.plan, golden)
    scored.push({
      promptId: golden.id,
      message: golden.message,
      pass: match.pass,
      failures: match.failures,
      plan: route.plan,
    })
  }

  const summary = scoreGoldenRouterResults(
    scored.map((row) => ({ pass: row.pass, promptId: row.promptId, failures: row.failures })),
  )

  return {
    passCount: summary.passCount,
    total: summary.total,
    minPass: GOLDEN_PASS_BAR.minPass,
    passedBar: summary.passCount >= GOLDEN_PASS_BAR.minPass,
    results: scored,
  }
}
