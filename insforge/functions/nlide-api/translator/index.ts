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
  ROUTER_INTENT_TYPES,
  ROUTER_PROMPT_OUTLINE,
  ROUTING_RULES,
  SPEC_FILE_ALLOWLIST,
  ROUTER_SCHEMA_FIELDS,
  formatRouterPromptOutline,
  isRouterIntentType,
  isSpecFileAllowed,
} from '../../../shared/translator/index.ts'

export type {
  BuildPhase,
  BuildJob,
  BuildPhaseStatus,
  GoldenPassBar,
  GoldenPrompt,
  GoldenPromptExpectation,
  RouterIntentType,
  RouterIntentTypeDef,
  RouterPromptOutline,
  TranslatorSpec,
} from '../../../shared/translator/index.ts'

export function handleGetTranslatorSpec() {
  return getTranslatorSpec()
}
