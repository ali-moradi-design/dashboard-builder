import { describe, expect, it } from 'vitest'

import type { DatasetField } from '../model/types'
import { formatDimensionValue, formatMeasureValue } from './formatValue'

const en = { lang: 'en', digits: 'native' } as const
const fa = { lang: 'fa', digits: 'native' } as const
const date: DatasetField = { name: 'd', type: 'date', label: { en: 'Date' } }
const weekday: DatasetField = {
  name: 'w',
  type: 'number',
  label: { en: 'Weekday' },
  display: 'weekday',
}
const hour: DatasetField = { name: 'h', type: 'number', label: { en: 'Hour' }, display: 'hour' }
const money: DatasetField = {
  name: 'm',
  type: 'number',
  label: { en: 'Revenue' },
  format: { style: 'currency', currency: 'EUR' },
}

describe('formatDimensionValue', () => {
  it('formats dates by grain', () => {
    expect(formatDimensionValue('2025-03-01', date, en, 'month')).toBe('Mar 2025')
    expect(formatDimensionValue('2025-03-01', date, en, 'year')).toBe('2025')
  })
  it('names weekdays and hours', () => {
    expect(formatDimensionValue(1, weekday, en)).toBe('Mon')
    expect(formatDimensionValue(7, weekday, en)).toBe('Sun')
    expect(formatDimensionValue(9, hour, en)).toBe('09:00')
    expect(formatDimensionValue(9, hour, fa)).toBe('۰۹:۰۰')
  })
  it('handles nulls', () => {
    expect(formatDimensionValue(null, date, en)).toBe('–')
  })
})

describe('formatMeasureValue', () => {
  it('uses the field format, counts as integers, and overrides', () => {
    expect(formatMeasureValue(998_400, money, en)).toBe('€998.4K')
    expect(formatMeasureValue(8412, money, en, undefined, 'count')).toBe('8,412')
    expect(formatMeasureValue(0.142, money, en, { style: 'percent' })).toBe('14.2%')
  })
})
