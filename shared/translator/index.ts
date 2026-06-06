import { BUILD_PHASES } from './buildPhases.ts'
import { GOLDEN_PASS_BAR, GOLDEN_PROMPTS } from './goldenPrompts.ts'
import {
  ROUTER_INTENT_TYPES,
  ROUTER_SCHEMA_FIELDS,
  ROUTING_RULES,
  SPEC_FILE_ALLOWLIST,
} from './intentTypes.ts'
import type { TranslatorSpec } from './types.ts'

export const TRANSLATOR_SPEC_VERSION = 'v0.1'

export function getTranslatorSpec(): TranslatorSpec {
  return {
    version: TRANSLATOR_SPEC_VERSION,
    intentTypes: ROUTER_INTENT_TYPES,
    routingRules: ROUTING_RULES,
    specFileAllowlist: SPEC_FILE_ALLOWLIST,
    schemaFields: ROUTER_SCHEMA_FIELDS,
    buildPhases: BUILD_PHASES,
    goldenPrompts: GOLDEN_PROMPTS,
    goldenPassBar: GOLDEN_PASS_BAR,
  }
}

export * from './types.ts'
export * from './intentTypes.ts'
export * from './acceptanceCriteriaBar.ts'
export * from './buildPhases.ts'
export * from './phaseExecution.ts'
export * from './featuresWriterGolden.ts'
export * from './featuresWriterTemplate.ts'
export * from './goldenPrompts.ts'
export * from './goldenRouterFixture.ts'
export * from './goldenRouterMatch.ts'
export * from './routerFailureBehavior.ts'
export * from './routerSmokeInvoke.ts'
export * from './taskWriterRules.ts'
export * from './validatorStrictness.ts'
export * from './remainingWritersOrder.ts'
export * from './canvasPlacementRules.ts'
export * from './canvasOpsMapping.ts'
export * from './previewDiffRules.ts'
export * from './exportScopeOnCommit.ts'
export * from './specFolderLayout.ts'
export * from './exportEndToEndSmoke.ts'
export * from './canvasTypes.ts'
export * from './canvasMapper.ts'
export * from './canvasMapperGolden.ts'
export * from './diffPreview.ts'
export * from './idAlloc.ts'
export * from './routerPromptOutline.ts'
