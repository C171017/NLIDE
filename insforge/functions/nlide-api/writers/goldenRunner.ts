import {
  evaluateFeaturesWriterGolden,
  FEATURES_WRITER_GOLDEN,
  FEATURES_WRITER_GOLDEN_PASS_BAR,
  type FeaturesWriterGoldenCase,
} from '../_shared/translator/index.ts'
import { writeFeaturesSection } from './featuresWriter.ts'
import { allocateNextFeatureId } from './schema.ts'

export interface GoldenFeaturesWriterRunResult {
  passCount: number
  total: number
  minPass: number
  passedBar: boolean
  results: Array<{
    caseId: string
    label: string
    pass: boolean
    failures: string[]
    section?: string
    writerError?: string
  }>
}

function existingFeatureIdsForGolden(golden: FeaturesWriterGoldenCase): string[] {
  const op = golden.routerPlan.operations.find((row) => row.target === 'features.md')
  if (op?.action === 'update' && op.entity_id) {
    return [op.entity_id]
  }

  const expectedId = golden.expectedSection.match(/^### (F-\d{3}):/m)?.[1]
  if (!expectedId) return []

  const num = parseInt(expectedId.slice(2), 10)
  return Array.from({ length: num - 1 }, (_, index) =>
    `F-${String(index + 1).padStart(3, '0')}`,
  )
}

/** Run all features writer golden cases through writeFeaturesSection and score. */
export async function runGoldenFeaturesWriterTests(): Promise<GoldenFeaturesWriterRunResult> {
  const results = []

  for (const golden of FEATURES_WRITER_GOLDEN) {
    const existingFeatureIds = existingFeatureIdsForGolden(golden)
    const write = await writeFeaturesSection({
      userMessage: golden.userMessage,
      routerPlan: golden.routerPlan,
      existingFeatureIds,
      existingSection: golden.existingSection,
    })

    if (!write.ok) {
      results.push({
        caseId: golden.id,
        label: golden.label,
        pass: false,
        failures: [`writer error: ${write.error.code} — ${write.error.message}`],
        writerError: write.error.message,
      })
      continue
    }

    const match = evaluateFeaturesWriterGolden(write.section, golden)
    results.push({
      caseId: golden.id,
      label: golden.label,
      pass: match.pass,
      failures: match.failures,
      section: write.section,
    })
  }

  const passCount = results.filter((row) => row.pass).length

  return {
    passCount,
    total: FEATURES_WRITER_GOLDEN.length,
    minPass: FEATURES_WRITER_GOLDEN_PASS_BAR.minPass,
    passedBar: passCount >= FEATURES_WRITER_GOLDEN_PASS_BAR.minPass,
    results,
  }
}

/** Smoke case: fwg-01 update pan/zoom (mirrors route smoke). */
export async function runFeaturesWriterSmoke() {
  const golden = FEATURES_WRITER_GOLDEN[0]
  return writeFeaturesSection({
    userMessage: golden.userMessage,
    routerPlan: golden.routerPlan,
    existingFeatureIds: existingFeatureIdsForGolden(golden),
    existingSection: golden.existingSection,
  })
}

export { allocateNextFeatureId }