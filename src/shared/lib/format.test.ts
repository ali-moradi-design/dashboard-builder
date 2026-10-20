import { describe, expect, it } from 'vitest'

import { formatDate, formatNumber } from './format'

const en = { lang: 'en', digits: 'native' } as const
const fa = { lang: 'fa', digits: 'native' } as const
const faLatin = { lang: 'fa', digits: 'latin' } as const

describe('formatNumber', () => {
  it('keeps the K suffix in Persian with native digits', () => {
    expect(formatNumber(998_400, en, { style: 'compact' })).toBe('998.4K')
    expect(formatNumber(998_400, fa, { style: 'compact' })).toBe('۹۹۸٫۴K')
    expect(formatNumber(998_400, faLatin, { style: 'compact' })).toBe('998.4K')
  })
  it('formats currency with a symbol and compacts large values', () => {
    expect(formatNumber(118.7, en, { style: 'currency' })).toBe('€118.7')
    expect(formatNumber(1_250_000, en, { style: 'currency' })).toBe('€1.3M')
  })
  it('formats percent', () => {
    expect(formatNumber(0.142, en, { style: 'percent' })).toBe('14.2%')
  })
  it('handles non-finite values', () => {
    expect(formatNumber(Number.NaN, en)).toBe('–')
  })
})

describe('formatDate', () => {
  it('uses the Gregorian calendar in Persian', () => {
    const d = new Date(Date.UTC(2025, 0, 15))
    expect(formatDate(d, en, 'month')).toBe('Jan 2025')
    expect(formatDate(d, fa, 'year')).toBe('۲۰۲۵')
  })
})
