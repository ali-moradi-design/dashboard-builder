import { beforeEach, describe, expect, it } from 'vitest'

import { sampleDashboard } from '../config/sample'
import { useEditor } from './editor'

const ed = () => useEditor.getState()
const undo = () => useEditor.temporal.getState().undo()
const redo = () => useEditor.temporal.getState().redo()
const count = () => ed().dashboard?.widgets.length

describe('editor store with undo/redo', () => {
  beforeEach(() => ed().load({ ...sampleDashboard, widgets: [] }))

  it('undoes and redoes add, move, settings and delete', () => {
    const id = ed().addWidget({ type: 'text', title: 'Note', settings: { content: 'a' } })
    expect(count()).toBe(1)
    ed().updateLayouts([{ i: id, x: 2, y: 0, w: 4, h: 4 }])
    ed().updateWidget(id, { settings: { content: 'b' } })
    ed().removeWidget(id)
    expect(count()).toBe(0)

    undo()
    expect(ed().dashboard?.widgets[0]?.settings).toEqual({ content: 'b' })
    undo()
    expect(ed().dashboard?.widgets[0]?.settings).toEqual({ content: 'a' })
    undo()
    expect(ed().dashboard?.widgets[0]?.layout.x).toBe(0)
    undo()
    expect(count()).toBe(0)
    redo()
    redo()
    expect(ed().dashboard?.widgets[0]?.layout.x).toBe(2)
  })

  it('places new widgets below the others with the default size', () => {
    ed().addWidget({ type: 'kpi', title: 'A', settings: {} })
    const b = ed().addWidget({ type: 'line', title: 'B', settings: {} })
    const w = ed().dashboard?.widgets.find((x) => x.id === b)
    expect(w?.layout).toEqual({ x: 0, y: 2, w: 6, h: 5 })
    expect(ed().selectedId).toBe(b)
  })

  it('merges quick typing into one undo step', () => {
    const id = ed().addWidget({ type: 'heading', title: '', settings: {} })
    for (const t of ['S', 'Sa', 'Sal', 'Sales']) ed().updateWidget(id, { title: t }, 'title')
    expect(ed().dashboard?.widgets[0]?.title).toBe('Sales')
    undo()
    expect(ed().dashboard?.widgets[0]?.title).toBe('')
  })

  it('ignores layout updates that change nothing', () => {
    const id = ed().addWidget({ type: 'text', title: '', settings: {} })
    const past = useEditor.temporal.getState().pastStates.length
    const w = ed().dashboard?.widgets[0]
    if (!w) throw new Error('missing')
    ed().updateLayouts([{ i: id, ...w.layout }])
    expect(useEditor.temporal.getState().pastStates.length).toBe(past)
  })

  it('duplicates a widget and clears history on load', () => {
    const id = ed().addWidget({ type: 'text', title: 'X', settings: {} })
    ed().duplicateWidget(id)
    expect(count()).toBe(2)
    ed().load(sampleDashboard)
    expect(useEditor.temporal.getState().pastStates).toHaveLength(0)
  })
})
