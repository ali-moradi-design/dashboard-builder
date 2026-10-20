import { describe, expect, it } from 'vitest'

import { sampleDashboard } from '@/entities/dashboard'

import { readDashboardFile } from './transfer'

const file = (text: string) => new File([text], 'd.json', { type: 'application/json' })

describe('readDashboardFile', () => {
  it('imports an exported dashboard and gives it a new id on conflict', async () => {
    const json = JSON.stringify(sampleDashboard)
    const fresh = await readDashboardFile(file(json), new Set())
    expect(fresh.id).toBe(sampleDashboard.id)
    const copy = await readDashboardFile(file(json), new Set([sampleDashboard.id]))
    expect(copy.id).not.toBe(sampleDashboard.id)
    expect(copy.widgets).toEqual(sampleDashboard.widgets)
  })
  it('rejects broken files', async () => {
    await expect(readDashboardFile(file('{nope'), new Set())).rejects.toThrow('notJson')
    await expect(readDashboardFile(file('{"schemaVersion":1}'), new Set())).rejects.toThrow()
  })
})
