/**
 * Bundled translator spec for nlide-api deploy.
 * Generated from shared/translator — run: npm run sync:translator
 */
import { getTranslatorSpec } from '../../../shared/translator/index.ts'

export { getTranslatorSpec }
export {
  BUILD_PHASES,
  GOLDEN_PASS_BAR,
  GOLDEN_PROMPTS,
  GOLDEN_ROUTER_FIXTURE,
  ROUTER_INTENT_TYPES,
  ROUTER_PROMPT_OUTLINE,
  ROUTING_RULES,
  SPEC_FILE_ALLOWLIST,
  ROUTER_SCHEMA_FIELDS,
  evaluateGoldenRouterOutput,
  formatRouterPromptOutline,
  getGoldenRouterFixture,
  isRouterIntentType,
  isSpecFileAllowed,
  scoreGoldenRouterResults,
} from '../../../shared/translator/index.ts'

export type {
  BuildPhase,
  BuildJob,
  BuildPhaseStatus,
  GoldenMatchResult,
  GoldenPassBar,
  GoldenPrompt,
  GoldenPromptExpectation,
  GoldenRouterFixtureCase,
  RouterIntentType,
  RouterIntentTypeDef,
  RouterOperation,
  RouterPlan,
  RouterPromptOutline,
  TranslatorSpec,
} from '../../../shared/translator/index.ts'

export function handleGetTranslatorSpec() {
  return getTranslatorSpec()
}
