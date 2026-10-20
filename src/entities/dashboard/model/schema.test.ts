import { describe, expect, it } from 'vitest'

import { sampleDashboard } from '../config/sample'
import { DashboardFormatError, parseDashboard } from './schema'

describe('parseDashboard', () => {
  it('accepts the sample dashboard and a JSON round trip', () => {
    expect(parseDashboard(JSON.parse(JSON.stringify(sampleDashboard)))).toEqual(sampleDashboard)
  })
  it('rejects non-objects, newer versions and broken widgets', () => {
    expect(() => parseDashboard('x')).toThrow(DashboardFormatError)
    expect(() => parseDashboard({ ...sampleDashboard, schemaVersion: 99 })).toThrow(/newer version/)
    expect(() => parseDashboard({ ...sampleDashboard, schemaVersion: 0 })).toThrow(/Unsupported/)
    expect(() =>
      parseDashboard({ ...sampleDashboard, widgets: [{ id: 'x', type: 'nope' }] }),
    ).toThrow(DashboardFormatError)
  })
  it('rejects invalid queries inside widgets', () => {
    const w = sampleDashboard.widgets.find((x) => x.query)
    if (!w?.query) throw new Error('sample needs a query widget')
    const broken = { ...sampleDashboard, widgets: [{ ...w, query: { ...w.query, limit: -1 } }] }
    expect(() => parseDashboard(broken)).toThrow(DashboardFormatError)
  })
})
