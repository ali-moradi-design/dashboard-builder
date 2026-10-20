import { DataTable } from '@/shared/ui'

import { formatOverride } from '../model/settings'
import { useChartContext } from './chartContext'
import type { RendererProps } from './types'

export function TableWidget({
  widget,
  settings: s,
  rows,
  columns,
  dataset,
}: RendererProps<'table'>) {
  const ctx = useChartContext(dataset, columns, formatOverride(s))
  // Start sorted like the query (the table can then be re-sorted by clicking a header).
  const querySort = widget.query?.sort[0]
  const sortCol = querySort ? columns.find((c) => c.id === querySort.by) : undefined
  return (
    <DataTable
      label={widget.title}
      rows={rows}
      pageSize={s.pageSize}
      className="h-full"
      initialSort={
        sortCol && querySort ? { key: sortCol.alias, desc: querySort.dir === 'desc' } : undefined
      }
      columns={columns.map((c) => ({
        key: c.alias,
        header: ctx.label(c),
        align: c.kind === 'measure' || c.type === 'number' ? 'end' : 'start',
        format: (v) => (c.kind === 'measure' ? ctx.value(c, v) : ctx.dim(c, v)),
      }))}
    />
  )
}
