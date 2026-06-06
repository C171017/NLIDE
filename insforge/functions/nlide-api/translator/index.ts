/**
 * Bundled translator spec for nlide-api deploy.
 * Generated from shared/translator — run: npm run sync:translator
 */
import { getTranslatorSpec } from '../../../shared/translator/index.ts'

export { getTranslatorSpec }
export {
  BUILD_PHASES,
  ROUTER_INTENT_TYPES,
  ROUTING_RULES,
  SPEC_FILE_ALLOWLIST,
  ROUTER_SCHEMA_FIELDS,
  isRouterIntentType,
  isSpecFileAllowed,
} from '../../../shared/translator/index.ts'

export type {
  BuildPhase,
  BuildJob,
  BuildPhaseStatus,
  RouterIntentType,
  RouterIntentTypeDef,
  TranslatorSpec,
} from '../../../shared/translator/index.ts'

export function handleGetTranslatorSpec() {
  return getTranslatorSpec()
}
