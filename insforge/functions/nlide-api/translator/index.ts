/**
 * Bundled translator spec for nlide-api deploy.
 * Generated from shared/translator — run: npm run sync:translator
 */
import { getTranslatorSpec } from '../../../shared/translator/index.ts'

export { getTranslatorSpec }
export {
  BUILD_PHASES,
  FEATURES_WRITER_TEMPLATE,
  GOLDEN_PASS_BAR,
  GOLDEN_PROMPTS,
  GOLDEN_ROUTER_FIXTURE,
  ROUTER_FAILURE_BEHAVIOR,
  ROUTER_INTENT_TYPES,
  ROUTER_PROMPT_OUTLINE,
  ROUTER_SMOKE_EXAMPLES,
  ROUTER_SMOKE_INVOKE_BRIEF,
  ROUTING_RULES,
  SPEC_FILE_ALLOWLIST,
  ROUTER_SCHEMA_FIELDS,
  buildRouteInvokePayload,
  evaluateGoldenRouterOutput,
  formatFeatureSection,
  formatFeaturesWriterTemplate,
  formatRouterFailureBehavior,
  formatRouterPromptOutline,
  formatRouterSmokeInvokeBrief,
  getGoldenRouterFixture,
  isRouterIntentType,
  isSpecFileAllowed,
  scoreGoldenRouterResults,
} from '../../../shared/translator/index.ts'

export type {
  BuildPhase,
  BuildJob,
  BuildPhaseStatus,
  FeaturePriority,
  FeatureSectionFields,
  FeatureStatus,
  FeaturesWriterTemplate,
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
  RouterFailureBehavior,
  RouterSmokeExample,
  RouterSmokeInvokeBrief,
  TranslatorSpec,
} from '../../../shared/translator/index.ts'

export function handleGetTranslatorSpec() {
  return getTranslatorSpec()
}
