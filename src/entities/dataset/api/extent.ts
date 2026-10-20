import { useQuery } from '@tanstack/react-query'

import { runQuery } from '@/shared/lib/duckdb'
import { quoteIdent } from '@/shared/lib/query-engine'

import type { Dataset } from '../model/types'
import { ensureDatasetLoaded } from './load'

/** First and last date of the dataset's date field (for date-filter presets). */
export function useDateExtent(dataset: Dataset | undefined) {
  return useQuery({
    queryKey: ['extent', dataset?.id ?? 'none'],
    enabled: Boolean(dataset?.dateField),
    queryFn: async ({ signal }) => {
      if (!dataset?.dateField) return null
      await ensureDatasetLoaded(dataset)
      const f = quoteIdent(dataset.dateField)
      const { rows } = await runQuery(
        `SELECT CAST(min(${f}) AS DATE) AS lo, CAST(max(${f}) AS DATE) AS hi FROM ${quoteIdent(dataset.table)}`,
        [],
        signal,
      )
      const lo = rows[0]?.lo
      const hi = rows[0]?.hi
      return typeof lo === 'string' && typeof hi === 'string' ? { from: lo, to: hi } : null
    },
  })
}
