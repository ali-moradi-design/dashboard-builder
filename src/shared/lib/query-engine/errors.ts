export type QueryErrorCode =
  | 'invalidSpec'
  | 'unknownField'
  | 'invalidAggregation'
  | 'invalidGrain'
  | 'invalidFilter'
  | 'unknownSortKey'

export class QueryError extends Error {
  readonly code: QueryErrorCode
  readonly detail: string | undefined

  constructor(code: QueryErrorCode, message: string, detail?: string) {
    super(message)
    this.name = 'QueryError'
    this.code = code
    this.detail = detail
  }
}
