import { useEffect, useState } from 'react'
import { BUILD_PHASES, getTranslatorSpec, type TranslatorSpec } from '@nlide/shared'
import { fetchTranslatorSpec } from '../lib/api'

export function useTranslatorSpec() {
  const [spec, setSpec] = useState<TranslatorSpec>(() => getTranslatorSpec())
  const [source, setSource] = useState<'local' | 'api'>('local')

  useEffect(() => {
    let cancelled = false

    void fetchTranslatorSpec()
      .then((remote) => {
        if (cancelled) return
        setSpec(remote)
        setSource('api')
      })
      .catch(() => {
        if (cancelled) return
        setSpec(getTranslatorSpec())
        setSource('local')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { spec, phases: spec.buildPhases ?? BUILD_PHASES, source }
}
