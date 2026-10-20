import type { ResultColumn } from '@/shared/lib/query-engine'

export type Row = Record<string, unknown>

export interface Series {
  id: string
  /** Raw key: the measure id, or the value of the second dimension. */
  key: unknown
  values: (number | null)[]
}

export interface SeriesData {
  /** Values of the first dimension, in display order. */
  categories: unknown[]
  series: Series[]
  /** Set when series come from a second dimension rather than measures. */
  splitBy: ResultColumn | undefined
  category: ResultColumn | undefined
}

const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v))

function sortCategories(values: unknown[], col: ResultColumn | undefined): unknown[] {
  if (col?.type === 'date' || col?.type === 'number') {
    return [...values].sort((a, b) =>
      a === null ? 1 : b === null ? -1 : (a as number | string) < (b as number | string) ? -1 : 1,
    )
  }
  return values
}

/**
 * Shapes query rows for charts. One dimension: one series per measure. Two
 * dimensions: the second dimension splits the first measure into series.
 */
export function toSeries(rows: readonly Row[], columns: readonly ResultColumn[]): SeriesData {
  const dims = columns.filter((c) => c.kind === 'dimension')
  const measures = columns.filter((c) => c.kind === 'measure')
  const cat = dims[0]
  const categories = sortCategories(cat ? [...new Set(rows.map((r) => r[cat.alias]))] : [null], cat)
  const index = new Map(categories.map((c, i) => [c, i]))

  const split = dims[1]
  const m0 = measures[0]
  if (split && m0) {
    const keys = [...new Set(rows.map((r) => r[split.alias]))]
    const series = keys.map((k, i): Series => ({
      id: `s${i}`,
      key: k,
      values: categories.map(() => null),
    }))
    const byKey = new Map(keys.map((k, i) => [k, series[i]]))
    for (const r of rows) {
      const s = byKey.get(r[split.alias])
      const i = index.get(cat ? r[cat.alias] : null)
      if (s && i !== undefined) s.values[i] = num(r[m0.alias])
    }
    return { categories, series, splitBy: split, category: cat }
  }

  const series = measures.map((m): Series => {
    const values: (number | null)[] = categories.map(() => null)
    for (const r of rows) {
      const i = index.get(cat ? r[cat.alias] : null)
      if (i !== undefined) values[i] = num(r[m.alias])
    }
    return { id: m.id, key: m.id, values }
  })
  return { categories, series, splitBy: undefined, category: cat }
}
