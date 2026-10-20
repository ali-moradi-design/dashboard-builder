import { describe, expect, it } from 'vitest'

import type { ResultColumn } from '@/shared/lib/query-engine'

import { toSeries } from './series'

const month: ResultColumn = {
  id: 'month',
  alias: 'd0',
  kind: 'dimension',
  field: 'order_date',
  type: 'date',
  grain: 'month',
}
const country: ResultColumn = {
  id: 'country',
  alias: 'd1',
  kind: 'dimension',
  field: 'country',
  type: 'string',
}
const rev: ResultColumn = {
  id: 'rev',
  alias: 'm0',
  kind: 'measure',
  field: 'revenue',
  type: 'number',
  agg: 'sum',
}
const qty: ResultColumn = {
  id: 'qty',
  alias: 'm1',
  kind: 'measure',
  field: 'quantity',
  type: 'number',
  agg: 'sum',
}

describe('toSeries', () => {
  it('makes one series per measure for one dimension, dates in order', () => {
    const d = toSeries(
      [
        { d0: '2025-02-01', m0: 20, m1: 2 },
        { d0: '2025-01-01', m0: 10, m1: 1 },
      ],
      [month, rev, qty],
    )
    expect(d.categories).toEqual(['2025-01-01', '2025-02-01'])
    expect(d.series.map((s) => s.values)).toEqual([
      [10, 20],
      [1, 2],
    ])
    expect(d.splitBy).toBeUndefined()
  })

  it('pivots the second dimension into series and fills gaps with null', () => {
    const d = toSeries(
      [
        { d0: '2025-01-01', d1: 'DE', m0: 5 },
        { d0: '2025-01-01', d1: 'FR', m0: 3 },
        { d0: '2025-02-01', d1: 'DE', m0: 7 },
      ],
      [month, { ...country }, rev],
    )
    expect(d.series.map((s) => s.key)).toEqual(['DE', 'FR'])
    expect(d.series.map((s) => s.values)).toEqual([
      [5, 7],
      [3, null],
    ])
    expect(d.splitBy?.id).toBe('country')
  })

  it('handles a query without dimensions (KPI)', () => {
    const d = toSeries([{ m0: 42 }], [rev])
    expect(d.categories).toEqual([null])
    expect(d.series[0]?.values).toEqual([42])
  })
})
