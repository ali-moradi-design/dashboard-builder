// @vitest-environment node
// Runs compiled queries against the real sample Parquet file with DuckDB (Node
// build of DuckDB-WASM), so the SQL the compiler writes is proven to execute.
import {
  createDuckDB,
  NODE_RUNTIME,
  VoidLogger,
  type DuckDBBindings,
} from '@duckdb/duckdb-wasm/blocking'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

import { compileQuery } from './compile'
import type { DatasetSchema, QuerySpec } from './spec'

const require = createRequire(import.meta.url)
const root = join(dirname(new URL(import.meta.url).pathname), '../../../..')
let db: DuckDBBindings

const orders: DatasetSchema = {
  table: 'orders',
  dateField: 'order_date',
  fields: [
    { name: 'order_date', type: 'date' },
    { name: 'country', type: 'string' },
    { name: 'category', type: 'string' },
    { name: 'revenue', type: 'number' },
    { name: 'profit', type: 'number' },
    { name: 'discount', type: 'number' },
  ],
}

beforeAll(async () => {
  const dist = dirname(require.resolve('@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm'))
  db = await createDuckDB(
    {
      mvp: { mainModule: join(dist, 'duckdb-mvp.wasm'), mainWorker: '' },
      eh: { mainModule: join(dist, 'duckdb-eh.wasm'), mainWorker: '' },
    },
    new VoidLogger(),
    NODE_RUNTIME,
  )
  await db.instantiate(() => undefined)
  db.registerFileBuffer(
    'orders.parquet',
    new Uint8Array(readFileSync(join(root, 'public/data/orders.parquet'))),
  )
  db.connect().query(`CREATE VIEW orders AS SELECT * FROM 'orders.parquet'`)
}, 60_000)

function run(spec: QuerySpec, dateRange?: { from?: string; to?: string }) {
  const c = compileQuery(spec, orders, { dateRange })
  const conn = db.connect()
  const stmt = conn.prepare(c.sql)
  const rows = (stmt.query(...c.params).toArray() as { toJSON(): Record<string, unknown> }[]).map(
    (r) => r.toJSON(),
  )
  stmt.close()
  conn.close()
  return rows
}

const spec = (patch: Partial<QuerySpec>): QuerySpec => ({
  datasetId: 'orders',
  measures: [{ id: 'rev', agg: 'sum', field: 'revenue' }],
  dimensions: [],
  filters: [],
  sort: [],
  limit: 1000,
  ...patch,
})

describe('compiled SQL on the sample orders', () => {
  it('sums revenue by month for Germany in 2025', () => {
    const rows = run(
      spec({
        dimensions: [{ id: 'month', field: 'order_date', grain: 'month' }],
        filters: [{ field: 'country', op: 'eq', value: 'Germany' }],
      }),
      { from: '2025-01-01', to: '2025-12-31' },
    )
    expect(rows).toHaveLength(12)
    expect(rows.every((r) => typeof r.m0 === 'number' && r.m0 > 0)).toBe(true)
  })

  it('counts rows and agrees with an unfiltered total', () => {
    const [all] = run(spec({ measures: [{ id: 'n', agg: 'count' }] }))
    const byCountry = run(
      spec({ measures: [{ id: 'n', agg: 'count' }], dimensions: [{ id: 'c', field: 'country' }] }),
    )
    expect(byCountry).toHaveLength(6)
    expect(byCountry.reduce((s, r) => s + (r.m0 as number), 0)).toBe(all?.m0)
  })

  it('groups by two fields with in-list and between filters', () => {
    const rows = run(
      spec({
        dimensions: [
          { id: 'c', field: 'country' },
          { id: 'k', field: 'category' },
        ],
        filters: [
          { field: 'country', op: 'in', value: ['Germany', 'France'] },
          { field: 'discount', op: 'between', value: [0, 0.2] },
        ],
        sort: [{ by: 'rev', dir: 'desc' }],
        limit: 5,
      }),
    )
    expect(rows).toHaveLength(5)
    const values = rows.map((r) => r.m0 as number)
    expect([...values].sort((a, b) => b - a)).toEqual(values)
  })

  it('does not execute injected text', () => {
    const rows = run(spec({ filters: [{ field: 'country', op: 'eq', value: "x' OR '1'='1" }] }))
    expect(rows[0]?.m0).toBeNull()
  })
})
