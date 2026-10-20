import { useSettings } from '../model'

import type { FormatContext } from './format'

export function useFormat(): FormatContext {
  const lang = useSettings((s) => s.lang)
  const digits = useSettings((s) => s.digits)
  return { lang, digits }
}
