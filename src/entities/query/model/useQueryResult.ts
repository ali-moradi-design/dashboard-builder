import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { ensureDatasetLoaded, toQuerySchema, type Dataset } from '@/entities/dataset/@x/query'
import { runQuery, type Row } from '@/shared/lib/duckdb'
import {
  compileQuery,
  QueryError,
  type CompiledQuery,
  type DateRange,
  type QuerySpec,
} from '@/shared/lib/query-engine'

export interface QueryResultState {
  compiled: CompiledQuery | undefined
  /** Compile error (invalid query for this dataset). */
  compileError: QueryError | undefined
  rows: Row[] | undefined
  error: Error | null
  isLoading: boolean
  isFetching: boolean
}

function tryCompile(
  spec: QuerySpec | undefined,
  dataset: Dataset | undefined,
  dateRange: DateRange | undefined,
) {
  if (!spec || !dataset) return { compiled: undefined, compileError: undefined }
  try {
    return {
      compiled: compileQuery(spec, toQuerySchema(dataset), { dateRange }),
      compileError: undefined,
    }
  } catch (e) {
    if (e instanceof QueryError) return { compiled: undefined, compileError: e }
    throw e
  }
}

/**
 * Runs a query spec. Results are cached by the hash of the compiled SQL, so
 * widgets with the same query share one execution; a stale query is cancelled
 * when its inputs change.
 */
export function useQueryResult(
  spec: QuerySpec | undefined,
  dataset: Dataset | undefined,
  dateRange?: DateRange,
): QueryResultState {
  const { compiled, compileError } = tryCompile(spec, dataset, dateRange)
  const query = useQuery({
    queryKey: ['query', compiled?.hash ?? 'none'],
    enabled: compiled !== undefined && dataset !== undefined,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      if (!compiled || !dataset) return []
      await ensureDatasetLoaded(dataset)
      const result = await runQuery(compiled.sql, compiled.params, signal)
      return result.rows
    },
  })
  return {
    compiled,
    compileError,
    rows: query.data,
    error: query.error,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  }
}
