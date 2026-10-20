import { QueryError } from './errors'
import { hashString } from './hash'
import {
  querySpecSchema,
  type CompiledQuery,
  type DatasetSchema,
  type DateRange,
  type FieldSchema,
  type Filter,
  type QuerySpec,
  type ResultColumn,
  type SqlParam,
} from './spec'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Quotes an identifier for DuckDB. Only names from the dataset schema reach here. */
export function quoteIdent(name: string): string {
  return '"' + name.replaceAll('"', '""') + '"'
}

export interface CompileOptions {
  dateRange?: DateRange | undefined
}

/**
 * Compiles a JSON query into parameterized SQL. Identifiers are checked against
 * the dataset schema and quoted; every value is a bound parameter.
 */
export function compileQuery(
  spec: unknown,
  dataset: DatasetSchema,
  options: CompileOptions = {},
): CompiledQuery {
  const parsed = querySpecSchema.safeParse(spec)
  if (!parsed.success) {
    throw new QueryError(
      'invalidSpec',
      parsed.error.issues[0]?.message ?? 'Invalid query',
      JSON.stringify(parsed.error.issues),
    )
  }
  const q: QuerySpec = parsed.data
  const fields = new Map(dataset.fields.map((f) => [f.name, f]))
  const field = (name: string): FieldSchema => {
    const f = fields.get(name)
    if (!f) throw new QueryError('unknownField', `Unknown field "${name}"`, name)
    return f
  }

  const columns: ResultColumn[] = []
  const select: string[] = []
  const params: SqlParam[] = []

  q.dimensions.forEach((d, i) => {
    const f = field(d.field)
    const alias = `d${i}`
    let expr = quoteIdent(f.name)
    if (d.grain) {
      if (f.type !== 'date')
        throw new QueryError('invalidGrain', `"${f.name}" is not a date field`, f.name)
      expr =
        d.grain === 'day'
          ? `CAST(${expr} AS DATE)`
          : `CAST(date_trunc('${d.grain}', ${expr}) AS DATE)`
    }
    select.push(`${expr} AS ${alias}`)
    columns.push({
      id: d.id,
      alias,
      kind: 'dimension',
      field: f.name,
      type: f.type,
      grain: d.grain,
    })
  })

  q.measures.forEach((m, i) => {
    const alias = `m${i}`
    let expr: string
    if (m.agg === 'count') {
      expr = m.field === undefined ? 'count(*)' : `count(${quoteIdent(field(m.field).name)})`
    } else {
      if (m.field === undefined)
        throw new QueryError('invalidAggregation', `"${m.agg}" needs a field`)
      const f = field(m.field)
      if (f.type !== 'number') {
        throw new QueryError(
          'invalidAggregation',
          `"${m.agg}" needs a number field, "${f.name}" is ${f.type}`,
          f.name,
        )
      }
      expr = `${m.agg}(${quoteIdent(f.name)})`
    }
    select.push(`CAST(${expr} AS DOUBLE) AS ${alias}`)
    columns.push({ id: m.id, alias, kind: 'measure', field: m.field, type: 'number', agg: m.agg })
  })

  const where: string[] = []
  for (const filter of q.filters) where.push(compileFilter(filter, field(filter.field), params))

  const range = options.dateRange
  if (dataset.dateField && (range?.from || range?.to)) {
    const f = field(dataset.dateField)
    for (const [value, op] of [
      [range.from, '>='],
      [range.to, '<='],
    ] as const) {
      if (!value) continue
      if (!ISO_DATE.test(value)) throw new QueryError('invalidFilter', `Invalid date "${value}"`)
      where.push(`${quoteIdent(f.name)} ${op} CAST(? AS DATE)`)
      params.push(value)
    }
  }

  const byId = new Map(columns.map((c) => [c.id, c]))
  const order = q.sort.map((s) => {
    const col = byId.get(s.by)
    if (!col) throw new QueryError('unknownSortKey', `Unknown sort key "${s.by}"`, s.by)
    return `${col.alias} ${s.dir === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`
  })
  if (order.length === 0) {
    const dateDim = columns.find((c) => c.kind === 'dimension' && c.type === 'date')
    const firstMeasure = columns.find((c) => c.kind === 'measure')
    if (dateDim) order.push(`${dateDim.alias} ASC NULLS LAST`)
    else if (firstMeasure) order.push(`${firstMeasure.alias} DESC NULLS LAST`)
    else if (columns[0]) order.push(`${columns[0].alias} ASC NULLS LAST`)
  }

  const dims = columns.filter((c) => c.kind === 'dimension')
  const parts = [`SELECT ${select.join(', ')}`, `FROM ${quoteIdent(dataset.table)}`]
  if (where.length) parts.push(`WHERE ${where.join(' AND ')}`)
  if (dims.length) parts.push(`GROUP BY ${dims.map((c) => c.alias).join(', ')}`)
  parts.push(`ORDER BY ${order.join(', ')}`)
  parts.push(`LIMIT ${q.limit}`)
  const sql = parts.join('\n')

  return { sql, params, columns, hash: hashString(JSON.stringify([sql, params])) }
}

function compileFilter(filter: Filter, f: FieldSchema, params: SqlParam[]): string {
  const col = quoteIdent(f.name)
  const fail = (why: string) =>
    new QueryError('invalidFilter', `Filter on "${f.name}": ${why}`, f.name)
  const placeholder = f.type === 'date' ? 'CAST(? AS DATE)' : '?'
  const one = (v: unknown): SqlParam => {
    if (Array.isArray(v)) throw fail('expected one value')
    return checkValue(v, f, fail)
  }

  switch (filter.op) {
    case 'isNull':
      return `${col} IS NULL`
    case 'notNull':
      return `${col} IS NOT NULL`
    case 'eq':
    case 'neq':
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const sqlOp = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' }[filter.op]
      if (
        filter.op !== 'eq' &&
        filter.op !== 'neq' &&
        (f.type === 'string' || f.type === 'boolean')
      ) {
        throw fail(`"${filter.op}" needs a number or date field`)
      }
      params.push(one(filter.value))
      return `${col} ${sqlOp} ${placeholder}`
    }
    case 'in':
    case 'notIn': {
      const values = Array.isArray(filter.value) ? filter.value : undefined
      if (!values || values.length === 0) throw fail('expected a non-empty list')
      for (const v of values) params.push(checkValue(v, f, fail))
      return `${col} ${filter.op === 'in' ? 'IN' : 'NOT IN'} (${values.map(() => placeholder).join(', ')})`
    }
    case 'contains': {
      if (f.type !== 'string') throw fail('"contains" needs a text field')
      params.push(one(filter.value))
      return `contains(lower(${col}), lower(?))`
    }
    case 'between': {
      const values = Array.isArray(filter.value) ? filter.value : undefined
      if (!values || values.length !== 2) throw fail('expected two values')
      if (f.type !== 'number' && f.type !== 'date')
        throw fail('"between" needs a number or date field')
      for (const v of values) params.push(checkValue(v, f, fail))
      return `${col} BETWEEN ${placeholder} AND ${placeholder}`
    }
  }
}

function checkValue(v: unknown, f: FieldSchema, fail: (why: string) => QueryError): SqlParam {
  switch (f.type) {
    case 'number':
      if (typeof v !== 'number' || !Number.isFinite(v)) throw fail('expected a number')
      return v
    case 'date':
      if (typeof v !== 'string' || !ISO_DATE.test(v)) throw fail('expected a YYYY-MM-DD date')
      return v
    case 'boolean':
      if (typeof v !== 'boolean') throw fail('expected true or false')
      return v
    case 'string':
      if (typeof v !== 'string') throw fail('expected text')
      return v
  }
}
