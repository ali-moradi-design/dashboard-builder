import { z } from 'zod'

/** Field types the engine understands. CSV imports are mapped onto these. */
export const fieldTypes = ['number', 'string', 'date', 'boolean'] as const
export type FieldType = (typeof fieldTypes)[number]

export interface FieldSchema {
  name: string
  type: FieldType
}

/** What the compiler needs to know about a dataset. */
export interface DatasetSchema {
  table: string
  fields: readonly FieldSchema[]
  /** Field the global date-range filter applies to. */
  dateField?: string | undefined
}

export const aggregations = ['sum', 'avg', 'count', 'min', 'max'] as const
export type Aggregation = (typeof aggregations)[number]

export const dateGrains = ['day', 'week', 'month', 'year'] as const
export type DateGrain = (typeof dateGrains)[number]

export const filterOps = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'notIn',
  'contains',
  'between',
  'isNull',
  'notNull',
] as const
export type FilterOp = (typeof filterOps)[number]

const id = z.string().regex(/^[A-Za-z][\w-]{0,39}$/)
const fieldName = z.string().min(1).max(128)
const scalar = z.union([z.string().max(500), z.number(), z.boolean()])

export const measureSchema = z.object({
  id,
  agg: z.enum(aggregations),
  /** Omit for `count` to count rows. */
  field: fieldName.optional(),
})

export const dimensionSchema = z.object({
  id,
  field: fieldName,
  /** Only for date fields. */
  grain: z.enum(dateGrains).optional(),
})

export const filterSchema = z.object({
  field: fieldName,
  op: z.enum(filterOps),
  value: z.union([scalar, z.array(scalar).max(100)]).optional(),
})

export const sortSchema = z.object({
  by: id,
  dir: z.enum(['asc', 'desc']),
})

export const MAX_LIMIT = 10_000

/** A query as stored in a dashboard: JSON, no SQL. */
export const querySpecSchema = z
  .object({
    datasetId: z.string().min(1).max(128),
    measures: z.array(measureSchema).max(6),
    dimensions: z.array(dimensionSchema).max(2),
    filters: z.array(filterSchema).max(20),
    sort: z.array(sortSchema).max(4),
    limit: z.number().int().min(1).max(MAX_LIMIT),
  })
  .refine((q) => q.measures.length + q.dimensions.length > 0, {
    message: 'A query needs at least one measure or group-by field',
  })
  .refine(
    (q) =>
      new Set([...q.measures, ...q.dimensions].map((x) => x.id)).size ===
      q.measures.length + q.dimensions.length,
    {
      message: 'Measure and dimension ids must be unique',
    },
  )

export type Measure = z.infer<typeof measureSchema>
export type Dimension = z.infer<typeof dimensionSchema>
export type Filter = z.infer<typeof filterSchema>
export type Sort = z.infer<typeof sortSchema>
export type QuerySpec = z.infer<typeof querySpecSchema>

export interface DateRange {
  /** Inclusive, `YYYY-MM-DD`. */
  from?: string | undefined
  /** Inclusive, `YYYY-MM-DD`. */
  to?: string | undefined
}

export type ColumnKind = 'dimension' | 'measure'

export interface ResultColumn {
  /** Id from the spec (measure or dimension). */
  id: string
  /** Column alias in the SQL result. */
  alias: string
  kind: ColumnKind
  field?: string | undefined
  type: FieldType
  agg?: Aggregation | undefined
  grain?: DateGrain | undefined
}

export type SqlParam = string | number | boolean

export interface CompiledQuery {
  sql: string
  params: SqlParam[]
  columns: ResultColumn[]
  /** Stable hash of SQL and params, used as the cache key. */
  hash: string
}
