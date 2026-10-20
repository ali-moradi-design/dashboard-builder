import { temporal } from 'zundo'
import { create } from 'zustand'

import {
  widgetDefinitions,
  type Widget,
  type WidgetLayout,
  type WidgetType,
} from '@/entities/widget/@x/dashboard'

import { newId, type Dashboard } from './schema'

type WidgetPatch = Partial<Pick<Widget, 'title' | 'settings' | 'query' | 'type'>>

interface EditorState {
  dashboard: Dashboard | null
  selectedId: string | null
  /** Saved to storage since the last change. */
  dirty: boolean
  /** Bumped on undo/redo so forms can reload their values. */
  historyRev: number
  undo: () => void
  redo: () => void
  load: (dashboard: Dashboard) => void
  select: (id: string | null) => void
  setTitle: (title: string) => void
  addWidget: (
    widget: Pick<Widget, 'type' | 'title' | 'query' | 'settings'>,
    at?: Partial<WidgetLayout>,
  ) => string
  updateLayouts: (layouts: readonly ({ i: string } & WidgetLayout)[]) => void
  /** Repeated patches with the same `coalesce` key within a short time become one undo step (typing). */
  updateWidget: (id: string, patch: WidgetPatch, coalesce?: string) => void
  removeWidget: (id: string) => void
  duplicateWidget: (id: string) => void
  markSaved: () => void
}

const COALESCE_MS = 800
let lastCoalesce: { key: string; at: number } | null = null

function bottom(widgets: readonly Widget[]): number {
  return widgets.reduce((max, w) => Math.max(max, w.layout.y + w.layout.h), 0)
}

/**
 * Editing state of one dashboard. Only the dashboard document is tracked by
 * zundo, so every edit (add, move, resize, delete, settings, query) can be
 * undone and redone; selection is not part of history.
 */
export const useEditor = create<EditorState>()(
  temporal(
    (set, get) => {
      const change = (fn: (d: Dashboard) => Dashboard, coalesce?: string) => {
        const d = get().dashboard
        if (!d) return
        const now = Date.now()
        const merge =
          coalesce !== undefined &&
          lastCoalesce?.key === coalesce &&
          now - lastCoalesce.at < COALESCE_MS
        lastCoalesce = coalesce === undefined ? null : { key: coalesce, at: now }
        if (merge) useEditor.temporal.getState().pause()
        set({ dashboard: fn(d), dirty: true })
        if (merge) useEditor.temporal.getState().resume()
      }
      const mapWidgets = (d: Dashboard, fn: (w: Widget) => Widget): Dashboard => ({
        ...d,
        widgets: d.widgets.map(fn),
      })

      return {
        dashboard: null,
        selectedId: null,
        dirty: false,
        historyRev: 0,
        undo: () => {
          useEditor.temporal.getState().undo()
          set((st) => ({ historyRev: st.historyRev + 1, dirty: true }))
        },
        redo: () => {
          useEditor.temporal.getState().redo()
          set((st) => ({ historyRev: st.historyRev + 1, dirty: true }))
        },
        load: (dashboard) => {
          lastCoalesce = null
          set({ dashboard, selectedId: null, dirty: false })
          useEditor.temporal.getState().clear()
        },
        select: (selectedId) => set({ selectedId }),
        setTitle: (title) => change((d) => ({ ...d, title }), 'title'),
        addWidget: (w, at) => {
          const id = newId('w')
          const def = widgetDefinitions[w.type]
          change((d) => ({
            ...d,
            widgets: [
              ...d.widgets,
              {
                ...w,
                id,
                layout: {
                  x: at?.x ?? 0,
                  y: at?.y ?? bottom(d.widgets),
                  w: at?.w ?? def.defaultSize.w,
                  h: at?.h ?? def.defaultSize.h,
                },
              },
            ],
          }))
          set({ selectedId: id })
          return id
        },
        updateLayouts: (layouts) => {
          const byId = new Map(layouts.map((l) => [l.i, l]))
          const d = get().dashboard
          if (!d) return
          const changed = d.widgets.some((w) => {
            const l = byId.get(w.id)
            return (
              l &&
              (l.x !== w.layout.x || l.y !== w.layout.y || l.w !== w.layout.w || l.h !== w.layout.h)
            )
          })
          if (!changed) return
          change((dash) =>
            mapWidgets(dash, (w) => {
              const l = byId.get(w.id)
              return l ? { ...w, layout: { x: l.x, y: l.y, w: l.w, h: l.h } } : w
            }),
          )
        },
        updateWidget: (id, patch, coalesce) =>
          change(
            (d) => mapWidgets(d, (w) => (w.id === id ? { ...w, ...patch } : w)),
            coalesce && `${id}:${coalesce}`,
          ),
        removeWidget: (id) => {
          change((d) => ({ ...d, widgets: d.widgets.filter((w) => w.id !== id) }))
          if (get().selectedId === id) set({ selectedId: null })
        },
        duplicateWidget: (id) => {
          const src = get().dashboard?.widgets.find((w) => w.id === id)
          if (!src) return
          const copy = get().addWidget(
            { type: src.type, title: src.title, query: src.query, settings: src.settings },
            { w: src.layout.w, h: src.layout.h },
          )
          set({ selectedId: copy })
        },
        markSaved: () => set({ dirty: false }),
      }
    },
    {
      partialize: (s) => ({ dashboard: s.dashboard }),
      // Selection changes are not edits: only record when the document changed.
      equality: (a, b) => a.dashboard === b.dashboard,
      limit: 100,
    },
  ),
)

export type { WidgetType }
