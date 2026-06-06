import { runCanvasMapperGolden } from '../_shared/translator/canvasMapperGolden.ts'

export interface CanvasMapperGoldenRunResult {
  passCount: number
  total: number
  minPass: number
  passedBar: boolean
  results: Array<{
    caseId: string
    pass: boolean
    failures: string[]
  }>
}

/** Run canvas mapper golden cases (no LLM). */
export function runCanvasMapperGoldenTests(): CanvasMapperGoldenRunResult {
  const scored = runCanvasMapperGolden()
  return {
    passCount: scored.passCount,
    total: scored.total,
    minPass: 4,
    passedBar: scored.passedBar,
    results: scored.results.map((row) => ({
      caseId: row.caseId,
      pass: row.pass,
      failures: row.failures,
    })),
  }
}
