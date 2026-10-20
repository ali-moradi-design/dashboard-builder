import type { CSSProperties, ReactNode } from 'react'

import type { Widget } from '@/entities/widget'

export const ROW_HEIGHT = 56
export const GAP = 16

/** Minimum rows when widgets stack on narrow screens. */
function mobileRows(w: Widget): number {
  return Math.max(w.layout.h, w.type === 'heading' || w.type === 'kpi' ? 1 : 4)
}

export interface DashboardGridProps {
  widgets: readonly Widget[]
  /** The page composes the grid with the widget frame (FSD: no cross-imports between widgets). */
  renderWidget: (widget: Widget) => ReactNode
}

/**
 * Read-only dashboard layout on a 12-column CSS grid. CSS grid follows the
 * page direction, so the layout mirrors itself in Persian. On narrow screens
 * widgets stack in reading order.
 */
export function DashboardGrid({ widgets, renderWidget }: DashboardGridProps) {
  const ordered = [...widgets].sort((a, b) => a.layout.y - b.layout.y || a.layout.x - b.layout.x)
  return (
    <div
      className="flex flex-col gap-4 md:grid md:grid-cols-12"
      style={{ gridAutoRows: `${ROW_HEIGHT}px`, gap: GAP }}
    >
      {ordered.map((w) => (
        <div
          key={w.id}
          className="min-w-0 max-md:h-(--h) md:col-(--col) md:row-(--row)"
          style={
            {
              '--col': `${w.layout.x + 1} / span ${w.layout.w}`,
              '--row': `${w.layout.y + 1} / span ${w.layout.h}`,
              '--h': `${mobileRows(w) * ROW_HEIGHT + (mobileRows(w) - 1) * GAP}px`,
            } as CSSProperties
          }
        >
          {renderWidget(w)}
        </div>
      ))}
    </div>
  )
}
