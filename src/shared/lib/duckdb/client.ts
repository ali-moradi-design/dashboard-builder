import * as duckdb from '@duckdb/duckdb-wasm'
import ehWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url'
import ehWasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'
import mvpWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'
import { DataType, Table } from 'apache-arrow'

const bundles: duckdb.DuckDBBundles = {
  mvp: { mainModule: mvpWasm, mainWorker: mvpWorker },
  eh: { mainModule: ehWasm, mainWorker: ehWorker },
}

let dbPromise: Promise<duckdb.AsyncDuckDB> | undefined

/** One DuckDB instance per tab, running in a Web Worker. Created on first use. */
export function getDuckDB(): Promise<duckdb.AsyncDuckDB> {
  dbPromise ??= (async () => {
    const bundle = await duckdb.selectBundle(bundles)
    if (!bundle.mainWorker) throw new Error('No DuckDB worker bundle')
    const worker = new Worker(bundle.mainWorker)
    const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker)
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
    return db
  })()
  return dbPromise
}

export type Row = Record<string, unknown>

export interface QueryResult {
  rows: Row[]
  columns: { name: string; type: string }[]
}

export class QueryCancelledError extends Error {
  constructor() {
    super('Query cancelled')
    this.name = 'QueryCancelledError'
  }
}

/**
 * Runs a parameterized query on its own connection. Aborting the signal cancels
 * the running query.
 */
export async function runQuery(
  sql: string,
  params: readonly unknown[] = [],
  signal?: AbortSignal,
): Promise<QueryResult> {
  const db = await getDuckDB()
  if (signal?.aborted) throw new QueryCancelledError()
  const conn = await db.connect()
  const onAbort = () => void conn.cancelSent()
  signal?.addEventListener('abort', onAbort, { once: true })
  try {
    const stmt = await conn.prepare(sql)
    try {
      const reader = await stmt.send(...params)
      const batches = []
      for await (const batch of reader) {
        if (signal?.aborted) throw new QueryCancelledError()
        batches.push(batch)
      }
      if (signal?.aborted) throw new QueryCancelledError()
      return toResult(new Table(batches))
    } finally {
      await stmt.close()
    }
  } catch (e) {
    if (signal?.aborted) throw new QueryCancelledError()
    throw e
  } finally {
    signal?.removeEventListener('abort', onAbort)
    await conn.close()
  }
}

/** Runs SQL without a result (DDL). Only call with trusted, quoted identifiers. */
export async function execute(sql: string): Promise<void> {
  const db = await getDuckDB()
  const conn = await db.connect()
  try {
    await conn.query(sql)
  } finally {
    await conn.close()
  }
}

/** Converts Arrow values to plain JS: dates become `YYYY-MM-DD`, big ints numbers. */
export function toResult(table: Table): QueryResult {
  const fields = table.schema.fields
  const columns = fields.map((f) => ({ name: f.name, type: String(f.type) }))
  const converters = fields.map((f) => converterFor(f.type as DataType))
  const rows: Row[] = []
  const cols = fields.map((_, i) => table.getChildAt(i))
  for (let r = 0; r < table.numRows; r++) {
    const row: Row = {}
    fields.forEach((f, i) => {
      row[f.name] = converters[i]?.(cols[i]?.get(r))
    })
    rows.push(row)
  }
  return { rows, columns }
}

function converterFor(type: DataType): (v: unknown) => unknown {
  if (DataType.isDate(type) || DataType.isTimestamp(type)) {
    const dateOnly = DataType.isDate(type)
    return (v) => {
      if (v === null || v === undefined) return null
      const d = v instanceof Date ? v : new Date(Number(v))
      return dateOnly ? d.toISOString().slice(0, 10) : d.toISOString()
    }
  }
  if (DataType.isInt(type) || DataType.isDecimal(type)) {
    return (v) =>
      v === null || v === undefined ? null : typeof v === 'bigint' ? Number(v) : Number(v)
  }
  return (v) => (typeof v === 'bigint' ? Number(v) : v)
}
