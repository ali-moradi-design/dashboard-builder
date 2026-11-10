import { useMemo } from 'react'

import type { DateRange } from '@/shared/lib/query-engine'

const NO_RANGE: DateRange = {}

/**
 * The date range in effect: the URL wins over the dashboard's saved range.
 * The result keeps its identity while the dates are the same, so widgets
 * that receive it are not re-rendered (and their queries not recompiled)
 * each time the page renders.
 */
export function useDateRange(
  search: { from?: string | undefined; to?: string | undefined },
  saved: DateRange | undefined,
): DateRange {
  const { from, to } = search
  return useMemo(
    () => (from !== undefined || to !== undefined ? { from, to } : (saved ?? NO_RANGE)),
    [from, to, saved],
  )
}
