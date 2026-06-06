import { BUILD_PHASES } from './buildPhases.ts'
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
  }
}

export * from './types.ts'
export * from './intentTypes.ts'
export * from './buildPhases.ts'
