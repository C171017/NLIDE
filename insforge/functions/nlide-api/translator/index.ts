/**
 * Bundled translator spec for nlide-api deploy.
 * Source of truth: shared/translator — run: npm run sync:translator
 */
import { getTranslatorSpec } from '../_shared/translator/index.ts'

export { getTranslatorSpec }
export {
  ACCEPTANCE_CRITERIA_BAR,
  BUILD_PHASES,
  FEATURES_WRITER_GOLDEN,
  FEATURES_WRITER_GOLDEN_PASS_BAR,
  FEATURES_WRITER_TEMPLATE,
  GOLDEN_PASS_BAR,
  GOLDEN_PROMPTS,
  GOLDEN_ROUTER_FIXTURE,
  ROUTER_FAILURE_BEHAVIOR,
  ROUTER_INTENT_TYPES,
  ROUTER_PROMPT_OUTLINE,
  ROUTER_SMOKE_EXAMPLES,
  ROUTER_SMOKE_INVOKE_BRIEF,
  TASK_WRITER_RULES,
  ROUTING_RULES,
  SPEC_FILE_ALLOWLIST,
  ROUTER_SCHEMA_FIELDS,
  buildRouteInvokePayload,
  evaluateFeaturesWriterGolden,
  evaluateGoldenRouterOutput,
  formatAcceptanceCriteriaBar,
  formatFeatureSection,
  formatFeaturesWriterTemplate,
  formatTaskSection,
  formatTaskWriterRules,
  formatRouterFailureBehavior,
  formatRouterPromptOutline,
  formatRouterSmokeInvokeBrief,
  getFeaturesWriterGolden,
  getGoldenRouterFixture,
  isLikelyWeakCriterion,
  isRouterIntentType,
  isSpecFileAllowed,
  scoreGoldenRouterResults,
} from '../_shared/translator/index.ts'

export type {
  AcceptanceCriteriaBar,
  AcceptanceCriteriaExample,
  BuildPhase,
  BuildJob,
  BuildPhaseStatus,
  FeaturesWriterGoldenCase,
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
  TaskSectionFields,
  TaskStatus,
  TaskWriterRules,
  TranslatorSpec,
} from '../_shared/translator/index.ts'

export function handleGetTranslatorSpec() {
  return getTranslatorSpec()
}
