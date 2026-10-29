import { compile, createRegistry } from '@formcanvas/engine'
import { allFields } from '@formcanvas/engine/fields/all'
import { describe, expect, it } from 'vitest'

import { settingsSchemas } from '../model/settings'
import { widgetTypes } from '../model/types'
import { settingsForm } from './settingsForms'

const registry = createRegistry(allFields)

describe('widget settings forms', () => {
  it.each(widgetTypes)('the %s form is a valid formcanvas document for its settings', (type) => {
    const doc = settingsForm(type)
    const compiled = compile(doc, { registry })
    expect(compiled).toBeTruthy()
    const keys = doc.steps.flatMap((s) => s.fields.map((f) => f.key))
    const settingKeys = Object.keys(settingsSchemas[type].shape)
    for (const k of keys) expect(settingKeys).toContain(k)
  })
})
