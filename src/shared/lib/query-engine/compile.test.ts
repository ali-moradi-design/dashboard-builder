import { describe, expect, it } from 'vitest'

import { compileQuery, quoteIdent } from './compile'
import { QueryError } from './errors'
import type { DatasetSchema, QuerySpec } from './spec'

const orders: DatasetSchema = {
  table: 'orders',
  dateField: 'order_date',
  fields: [
    { name: 'order_date', type: 'date' },
    { name: 'country', type: 'string' },
    { name: 'category', type: 'string' },
    { name: 'revenue', type: 'number' },
    { name: 'quantity', type: 'number' },
    { name: 'is_return', type: 'boolean' },
    { name: 'weird "name"', type: 'string' },
  ],
}

const base: QuerySpec = {
  datasetId: 'orders',
  measures: [{ id: 'rev', agg: 'sum', field: 'revenue' }],
  dimensions: [],
  filters: [],
  sort: [],
  limit: 100,
}

const q = (patch: Partial<QuerySpec>) => ({ ...base, ...patch })

function expectError(fn: () => unknown, code: QueryError['code']) {
  try {
    fn()
  } catch (e) {
    expect(e).toBeInstanceOf(QueryError)
    expect((e as QueryError).code).toBe(code)
    return
  }
  throw new Error('expected a QueryError')
}

describe('compileQuery', () => {
  it('compiles a single measure', () => {
    const c = compileQuery(base, orders)
    expect(c.sql).toBe(
      'SELECT CAST(sum("revenue") AS DOUBLE) AS m0\nFROM "orders"\nORDER BY m0 DESC NULLS LAST\nLIMIT 100',
    )
    expect(c.params).toEqual([])
    expect(c.columns).toEqual([
      { id: 'rev', alias: 'm0', kind: 'measure', field: 'revenue', type: 'number', agg: 'sum' },
    ])
  })

  it('compiles "sum of sales by month, Germany only"', () => {
    const c = compileQuery(
      q({
        dimensions: [{ id: 'month', field: 'order_date', grain: 'month' }],
        filters: [{ field: 'country', op: 'eq', value: 'Germany' }],
      }),
      orders,
    )
    expect(c.sql).toBe(
      [
        `SELECT CAST(date_trunc('month', "order_date") AS DATE) AS d0, CAST(sum("revenue") AS DOUBLE) AS m0`,
        'FROM "orders"',
        'WHERE "country" = ?',
        'GROUP BY d0',
        'ORDER BY d0 ASC NULLS LAST',
        'LIMIT 100',
      ].join('\n'),
    )
    expect(c.params).toEqual(['Germany'])
  })

  it.each(['day', 'week', 'year'] as const)('supports the %s grain', (grain) => {
    const c = compileQuery(q({ dimensions: [{ id: 'g', field: 'order_date', grain }] }), orders)
    expect(c.sql).toContain(
      grain === 'day' ? 'CAST("order_date" AS DATE) AS d0' : `date_trunc('${grain}', "order_date")`,
    )
  })

  it('groups by two fields', () => {
    const c = compileQuery(
      q({
        dimensions: [
          { id: 'c', field: 'country' },
          { id: 'k', field: 'category' },
        ],
      }),
      orders,
    )
    expect(c.sql).toContain('GROUP BY d0, d1')
    expect(c.columns.map((x) => x.alias)).toEqual(['d0', 'd1', 'm0'])
  })

  it('compiles every aggregation', () => {
    const c = compileQuery(
      q({
        measures: [
          { id: 'a', agg: 'sum', field: 'revenue' },
          { id: 'b', agg: 'avg', field: 'revenue' },
          { id: 'c', agg: 'min', field: 'quantity' },
          { id: 'd', agg: 'max', field: 'quantity' },
          { id: 'e', agg: 'count' },
          { id: 'f', agg: 'count', field: 'country' },
        ],
      }),
      orders,
    )
    for (const part of [
      'sum("revenue")',
      'avg("revenue")',
      'min("quantity")',
      'max("quantity")',
      'count(*)',
      'count("country")',
    ]) {
      expect(c.sql).toContain(`CAST(${part} AS DOUBLE)`)
    }
  })

  it('compiles every filter operator with bound values', () => {
    const c = compileQuery(
      q({
        filters: [
          { field: 'country', op: 'neq', value: 'France' },
          { field: 'revenue', op: 'gt', value: 10 },
          { field: 'revenue', op: 'gte', value: 11 },
          { field: 'revenue', op: 'lt', value: 1000 },
          { field: 'revenue', op: 'lte', value: 999 },
          { field: 'category', op: 'in', value: ['Furniture', 'Technology'] },
          { field: 'category', op: 'notIn', value: ['Accessories'] },
          { field: 'country', op: 'contains', value: 'man' },
          { field: 'order_date', op: 'between', value: ['2025-01-01', '2025-03-31'] },
          { field: 'country', op: 'notNull' },
          { field: 'category', op: 'isNull' },
          { field: 'is_return', op: 'eq', value: false },
        ],
      }),
      orders,
    )
    expect(c.sql).toContain(
      'WHERE "country" <> ? AND "revenue" > ? AND "revenue" >= ? AND "revenue" < ? AND "revenue" <= ? AND "category" IN (?, ?) AND "category" NOT IN (?) AND contains(lower("country"), lower(?)) AND "order_date" BETWEEN CAST(? AS DATE) AND CAST(? AS DATE) AND "country" IS NOT NULL AND "category" IS NULL AND "is_return" = ?',
    )
    expect(c.params).toEqual([
      'France',
      10,
      11,
      1000,
      999,
      'Furniture',
      'Technology',
      'Accessories',
      'man',
      '2025-01-01',
      '2025-03-31',
      false,
    ])
  })

  it('applies the global date range to the dataset date field', () => {
    const c = compileQuery(base, orders, { dateRange: { from: '2025-01-01', to: '2025-12-31' } })
    expect(c.sql).toContain(
      'WHERE "order_date" >= CAST(? AS DATE) AND "order_date" <= CAST(? AS DATE)',
    )
    expect(c.params).toEqual(['2025-01-01', '2025-12-31'])
  })

  it('applies an open-ended date range', () => {
    const c = compileQuery(base, orders, { dateRange: { from: '2025-06-01' } })
    expect(c.params).toEqual(['2025-06-01'])
    expect(c.sql).not.toContain('<=')
  })

  it('ignores the date range when the dataset has no date field', () => {
    const c = compileQuery(
      base,
      { ...orders, dateField: undefined },
      { dateRange: { from: '2025-01-01' } },
    )
    expect(c.sql).not.toContain('WHERE')
  })

  it('rejects a malformed date range', () => {
    expectError(
      () => compileQuery(base, orders, { dateRange: { from: '2025-1-1' } }),
      'invalidFilter',
    )
    expectError(
      () => compileQuery(base, orders, { dateRange: { from: "2025-01-01' OR 1=1 --" } }),
      'invalidFilter',
    )
  })

  it('sorts by measure or dimension id', () => {
    const c = compileQuery(
      q({
        dimensions: [{ id: 'country', field: 'country' }],
        sort: [
          { by: 'rev', dir: 'desc' },
          { by: 'country', dir: 'asc' },
        ],
      }),
      orders,
    )
    expect(c.sql).toContain('ORDER BY m0 DESC NULLS LAST, d0 ASC NULLS LAST')
  })

  it('defaults to the first measure descending without a date dimension', () => {
    const c = compileQuery(q({ dimensions: [{ id: 'country', field: 'country' }] }), orders)
    expect(c.sql).toContain('ORDER BY m0 DESC NULLS LAST')
  })

  it('orders dimension-only queries by the first dimension', () => {
    const c = compileQuery(
      q({ measures: [], dimensions: [{ id: 'country', field: 'country' }] }),
      orders,
    )
    expect(c.sql).toContain('ORDER BY d0 ASC NULLS LAST')
  })

  it('quotes identifiers safely', () => {
    expect(quoteIdent('a"b')).toBe('"a""b"')
    const c = compileQuery(q({ dimensions: [{ id: 'w', field: 'weird "name"' }] }), orders)
    expect(c.sql).toContain('"weird ""name""" AS d0')
  })

  it('never puts values into the SQL text', () => {
    const evil = "Germany'; DROP TABLE orders; --"
    const c = compileQuery(q({ filters: [{ field: 'country', op: 'eq', value: evil }] }), orders)
    expect(c.sql).not.toContain('DROP')
    expect(c.params).toEqual([evil])
  })

  it('produces a stable hash that changes with params', () => {
    const a = compileQuery(
      q({ filters: [{ field: 'country', op: 'eq', value: 'Germany' }] }),
      orders,
    )
    const b = compileQuery(
      q({ filters: [{ field: 'country', op: 'eq', value: 'Germany' }] }),
      orders,
    )
    const c = compileQuery(
      q({ filters: [{ field: 'country', op: 'eq', value: 'France' }] }),
      orders,
    )
    expect(a.hash).toBe(b.hash)
    expect(a.hash).not.toBe(c.hash)
    expect(a.hash).toMatch(/^[0-9a-f]{16}$/)
  })

  describe('rejects invalid queries', () => {
    it('unknown fields everywhere', () => {
      expectError(
        () => compileQuery(q({ measures: [{ id: 'x', agg: 'sum', field: 'nope' }] }), orders),
        'unknownField',
      )
      expectError(
        () => compileQuery(q({ dimensions: [{ id: 'x', field: 'nope' }] }), orders),
        'unknownField',
      )
      expectError(
        () => compileQuery(q({ filters: [{ field: 'nope', op: 'isNull' }] }), orders),
        'unknownField',
      )
    })
    it('SQL injection in identifiers', () => {
      expectError(
        () => compileQuery(q({ dimensions: [{ id: 'x', field: 'country" FROM x; --' }] }), orders),
        'unknownField',
      )
    })
    it('aggregations on the wrong type', () => {
      expectError(
        () => compileQuery(q({ measures: [{ id: 'x', agg: 'sum', field: 'country' }] }), orders),
        'invalidAggregation',
      )
      expectError(
        () => compileQuery(q({ measures: [{ id: 'x', agg: 'avg' }] }), orders),
        'invalidAggregation',
      )
    })
    it('a grain on a non-date field', () => {
      expectError(
        () =>
          compileQuery(q({ dimensions: [{ id: 'x', field: 'country', grain: 'month' }] }), orders),
        'invalidGrain',
      )
    })
    it('filter values of the wrong type', () => {
      expectError(
        () => compileQuery(q({ filters: [{ field: 'revenue', op: 'gt', value: '10' }] }), orders),
        'invalidFilter',
      )
      expectError(
        () =>
          compileQuery(
            q({ filters: [{ field: 'order_date', op: 'eq', value: 'yesterday' }] }),
            orders,
          ),
        'invalidFilter',
      )
      expectError(
        () => compileQuery(q({ filters: [{ field: 'country', op: 'gt', value: 'A' }] }), orders),
        'invalidFilter',
      )
      expectError(
        () => compileQuery(q({ filters: [{ field: 'country', op: 'in', value: [] }] }), orders),
        'invalidFilter',
      )
      expectError(
        () => compileQuery(q({ filters: [{ field: 'country', op: 'eq', value: ['a'] }] }), orders),
        'invalidFilter',
      )
      expectError(
        () =>
          compileQuery(q({ filters: [{ field: 'revenue', op: 'between', value: [1] }] }), orders),
        'invalidFilter',
      )
      expectError(
        () =>
          compileQuery(q({ filters: [{ field: 'revenue', op: 'contains', value: '1' }] }), orders),
        'invalidFilter',
      )
      expectError(
        () =>
          compileQuery(q({ filters: [{ field: 'revenue', op: 'eq', value: Number.NaN }] }), orders),
        'invalidSpec',
      )
    })
    it('unknown sort keys', () => {
      expectError(
        () => compileQuery(q({ sort: [{ by: 'missing', dir: 'asc' }] }), orders),
        'unknownSortKey',
      )
    })
    it('structurally invalid specs', () => {
      expectError(() => compileQuery(q({ measures: [], dimensions: [] }), orders), 'invalidSpec')
      expectError(() => compileQuery(q({ limit: 0 }), orders), 'invalidSpec')
      expectError(() => compileQuery(q({ limit: 1_000_000 }), orders), 'invalidSpec')
      expectError(
        () =>
          compileQuery(
            q({
              dimensions: [
                { id: 'a', field: 'country' },
                { id: 'b', field: 'category' },
                { id: 'c', field: 'country' },
              ],
            }),
            orders,
          ),
        'invalidSpec',
      )
      expectError(
        () =>
          compileQuery(
            q({
              measures: [{ id: 'rev', agg: 'sum', field: 'revenue' }],
              dimensions: [{ id: 'rev', field: 'country' }],
            }),
            orders,
          ),
        'invalidSpec',
      )
      expectError(
        () => compileQuery(q({ measures: [{ id: 'bad id!', agg: 'count' }] }), orders),
        'invalidSpec',
      )
      expectError(() => compileQuery({ nope: true }, orders), 'invalidSpec')
      expectError(
        () =>
          compileQuery(
            q({ measures: [{ id: 'x', agg: 'median' as 'sum', field: 'revenue' }] }),
            orders,
          ),
        'invalidSpec',
      )
    })
  })
})
