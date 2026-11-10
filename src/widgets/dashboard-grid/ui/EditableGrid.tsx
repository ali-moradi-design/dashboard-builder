import 'react-grid-layout/css/styles.css'
import ReactGridLayout, { useContainerWidth, type Layout, type LayoutItem } from 'react-grid-layout'
import { useEffect, useState, type ReactNode } from 'react'

import {
  GRID_COLS,
  widgetDefinitions,
  widgetTypes,
  type Widget,
  type WidgetLayout,
  type WidgetType,
} from '@/entities/widget'

import { GAP, ROW_HEIGHT } from './DashboardGrid'
import { edgeAutoScroll } from './edgeAutoScroll'

/** MIME types used when dragging a widget type from the palette. */
export const WIDGET_MIME = 'application/x-dashboard-widget'
export const widgetTypeMime = (type: WidgetType) => `${WIDGET_MIME}-${type.toLowerCase()}`

function typeFromDrag(types: readonly string[]): WidgetType | undefined {
  return widgetTypes.find((t) => types.includes(widgetTypeMime(t)))
}

export interface EditableGridProps {
  widgets: readonly Widget[]
  rtl: boolean
  onCommit: (layouts: ({ i: string } & WidgetLayout)[]) => void
  onDropType: (type: WidgetType, at: WidgetLayout) => void
  renderWidget: (widget: Widget) => ReactNode
}

/**
 * Drag-and-resize grid for edit mode. react-grid-layout positions items from
 * the left, so in RTL the x coordinate is mirrored on the way in and out.
 */
export function EditableGrid({
  widgets,
  rtl,
  onCommit,
  onDropType,
  renderWidget,
}: EditableGridProps) {
  const { width, containerRef, mounted } = useContainerWidth()
  const mirror = (x: number, w: number) => (rtl ? GRID_COLS - x - w : x)

  const layout: Layout = widgets.map((w) => {
    const def = widgetDefinitions[w.type]
    return {
      i: w.id,
      x: mirror(w.layout.x, w.layout.w),
      y: w.layout.y,
      w: w.layout.w,
      h: w.layout.h,
      minW: def.minSize.w,
      minH: def.minSize.h,
    }
  })

  // The drop target is the grid element itself: keep room below the last widget.
  const rows = widgets.reduce((m, w) => Math.max(m, w.layout.y + w.layout.h), 0) + 4
  const minHeight = `max(60vh, ${rows * (ROW_HEIGHT + GAP)}px)`

  /*
   * react-grid-layout 2.3 keeps the dragged item's pixel position in a ref and
   * memoizes its items, so the item is only re-drawn when it enters another
   * grid cell: it lags behind the pointer and then jumps. Giving the dragged
   * item a new child element on every move makes the library re-render it, so
   * it follows the pointer continuously. Resizing is left to snap to the grid:
   * redrawing a chart for every pixel is too slow to stay smooth.
   */
  const [active, setActive] = useState<{ id: string; tick: number } | null>(null)
  const follow = (item: LayoutItem | null, e: Event) => {
    edgeAutoScroll.track(e)
    if (item) setActive((a) => ({ id: item.i, tick: (a?.tick ?? 0) + 1 }))
  }

  // A drag that is cut short (the page is left) must not keep scrolling.
  useEffect(() => () => edgeAutoScroll.stop(), [])

  // Marks the grid while a widget is moved or resized (styled in index.css).
  // Set on the element directly: no re-render in the middle of a drag.
  const setDragging = (mode: 'move' | 'resize' | null, e?: Event) => {
    const el = containerRef.current
    if (!el) return
    if (mode) {
      el.dataset.dragging = mode === 'resize' && rtl ? 'resize-rtl' : mode
      // Only moving scrolls the page: a resize that scrolls would redraw the chart every frame.
      if (mode === 'move') edgeAutoScroll.start(e)
    } else {
      delete el.dataset.dragging
      edgeAutoScroll.stop()
    }
  }

  const commit = (next: Layout) => {
    setDragging(null)
    setActive(null)
    onCommit(
      next
        .filter((l) => l.i !== '__drop__')
        .map((l) => ({ i: l.i, x: mirror(l.x, l.w), y: l.y, w: l.w, h: l.h })),
    )
  }

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className="editable-grid rounded-lg"
      data-testid="editable-grid"
    >
      {mounted && (
        <ReactGridLayout
          layout={layout}
          width={width}
          style={{ minHeight }}
          gridConfig={{
            cols: GRID_COLS,
            rowHeight: ROW_HEIGHT,
            margin: [GAP, GAP],
            containerPadding: [0, 0],
          }}
          dragConfig={{
            enabled: true,
            cancel: 'button, input, select, textarea, a, [data-no-drag]',
            threshold: 4,
          }}
          resizeConfig={{ enabled: true, handles: [rtl ? 'sw' : 'se'] }}
          droppingItem={{ i: '__drop__', x: 0, y: 0, w: 4, h: 4 }}
          dropConfig={{
            enabled: true,
            defaultItem: { w: 4, h: 4 },
            onDragOver: (e: DragEvent) => {
              const type = typeFromDrag(e.dataTransfer ? [...e.dataTransfer.types] : [])
              if (!type) return false
              return widgetDefinitions[type].defaultSize
            },
          }}
          onDragStart={(_l, _o, _n, _p, e) => setDragging('move', e)}
          onDrag={(_l, _o, item, _p, e) => follow(item, e)}
          onResizeStart={(_l, _o, _n, _p, e) => setDragging('resize', e)}
          onDragStop={(next: Layout) => commit(next)}
          onResizeStop={(next: Layout) => commit(next)}
          onDrop={(_next: Layout, item: LayoutItem | undefined, e: Event) => {
            const type = typeFromDrag(
              (e as DragEvent).dataTransfer
                ? [...((e as DragEvent).dataTransfer as DataTransfer).types]
                : [],
            )
            if (!type || !item) return
            onDropType(type, { x: mirror(item.x, item.w), y: item.y, w: item.w, h: item.h })
          }}
        >
          {widgets.map((w) => (
            <div
              key={w.id}
              dir={rtl ? 'rtl' : 'ltr'}
              className="group"
              data-drag-tick={active?.id === w.id ? active.tick : undefined}
            >
              {renderWidget(w)}
            </div>
          ))}
        </ReactGridLayout>
      )}
    </div>
  )
}
