import type { QuerySpec } from '@/shared/lib/query-engine'

export function emptyQuery(datasetId: string): QuerySpec {
  return { datasetId, measures: [], dimensions: [], filters: [], sort: [], limit: 1000 }
}
