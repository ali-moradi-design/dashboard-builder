import { describe, expect, it } from 'vitest'

import type { QuerySpec } from '@/shared/lib/query-engine'

import {
  addDimension,
  addFilter,
  addMeasure,
  isCompleteFilter,
  removeColumn,
  runnable,
} from './draft'

const empty: QuerySpec = {
  datasetId: 'orders',
  measures: [],
  dimensions: [],
  filters: [],
  sort: [],
  limit: 1000,
}
const revenue = { name: 'revenue', type: 'number' } as const
const country = { name: 'country', type: 'string' } as const
const date = { name: 'order_date', type: 'date' } as const

describe('query draft helpers', () => {
  it('adds measures with a fitting aggregation and unique ids', () => {
    let q = addMeasure(empty, revenue)
    q = addMeasure(q, country)
    q = addMeasure(q, null)
    expect(q.measures).toEqual([
      { id: 'm1', agg: 'sum', field: 'revenue' },
      { id: 'm2', agg: 'count', field: 'country' },
      { id: 'm3', agg: 'count' },
    ])
  })

  it('adds at most two distinct group-bys, dates by month', () => {
    let q = addDimension(empty, date)
    q = addDimension(q, date)
    q = addDimension(q, country)
    q = addDimension(q, revenue)
    expect(q.dimensions).toEqual([
      { id: 'd1', field: 'order_date', grain: 'month' },
      { id: 'd2', field: 'country' },
    ])
  })

  it('drops incomplete filters before running', () => {
    let q = addFilter(empty, country)
    q = addFilter(q, date)
    expect(q.filters.map(isCompleteFilter)).toEqual([false, false])
    const [a, b] = q.filters
    if (!a || !b) throw new Error('expected two filters')
    q = {
      ...q,
      filters: [
        { ...a, value: 'Germany' },
        { ...b, value: ['2025-01-01', ''] },
      ],
    }
    expect(runnable(q).filters).toEqual([{ field: 'country', op: 'eq', value: 'Germany' }])
  })

  it('removes a column and its sort', () => {
    const q: QuerySpec = { ...addMeasure(empty, revenue), sort: [{ by: 'm1', dir: 'desc' }] }
    expect(removeColumn(q, 'm1')).toMatchObject({ measures: [], sort: [] })
  })
})
