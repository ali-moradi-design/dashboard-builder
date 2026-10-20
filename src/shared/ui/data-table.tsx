import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  FlexRender,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn, formatNumber, useFormat } from '../lib'

export type DataRow = Record<string, unknown>

export interface DataTableColumn {
  key: string
  header: string
  /** Numbers align to the end. */
  align?: 'start' | 'end'
  format?: (value: unknown) => string
}

export interface DataTableProps {
  columns: readonly DataTableColumn[]
  rows: DataRow[]
  pageSize?: number
  initialSort?: { key: string; desc: boolean } | undefined
  className?: string
  /** Accessible name of the table. */
  label: string
}

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, basic: sortFn_basic },
})
const helper = createColumnHelper<typeof features, DataRow>()

/** Sortable, paginated table built with TanStack Table. */
export function DataTable({
  columns,
  rows,
  pageSize = 10,
  initialSort,
  className,
  label,
}: DataTableProps) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const defs = helper.columns(
    columns.map((c) =>
      helper.accessor((row) => row[c.key] as string | number | null, {
        id: c.key,
        header: c.header,
        sortUndefined: 'last',
        sortFn: c.align === 'end' ? 'basic' : 'text',
        cell: (info) => {
          const v = info.getValue()
          return c.format ? c.format(v) : v === null ? '–' : String(v)
        },
      }),
    ),
  )
  const table = useTable({
    features,
    columns: defs,
    data: rows,
    initialState: {
      sorting: initialSort ? [{ id: initialSort.key, desc: initialSort.desc }] : [],
      pagination: { pageIndex: 0, pageSize },
    },
  })
  const alignOf = new Map(columns.map((c) => [c.key, c.align ?? 'start']))
  const pageIndex = table.state.pagination.pageIndex
  const pageCount = Math.max(1, table.getPageCount())
  const first = rows.length === 0 ? 0 : pageIndex * pageSize + 1
  const last = Math.min(rows.length, (pageIndex + 1) * pageSize)
  const n = (x: number) => formatNumber(x, fmt, { decimals: 0 })

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-[13px]" aria-label={label}>
          <thead className="sticky top-0 bg-surface">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const end = alignOf.get(header.column.id) === 'end'
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'
                      }
                      className={cn(
                        'border-b border-border px-2 py-1.5 font-medium text-muted',
                        end ? 'text-end' : 'text-start',
                        sorted && 'text-text',
                      )}
                    >
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn('inline-flex items-center gap-1', end && 'flex-row-reverse')}
                      >
                        <FlexRender header={header} />
                        {sorted === 'asc' ? (
                          <ArrowUp className="size-3.5 text-accent" aria-hidden />
                        ) : sorted === 'desc' ? (
                          <ArrowDown className="size-3.5 text-accent" aria-hidden />
                        ) : (
                          <ChevronsUpDown className="size-3.5 opacity-45" aria-hidden />
                        )}
                      </button>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-surface-2/60">
                {row.getAllCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      'border-b border-grid-line px-2 py-1.5',
                      alignOf.get(cell.column.id) === 'end' && 'text-end tabular-nums',
                    )}
                  >
                    <bdi>
                      <FlexRender cell={cell} />
                    </bdi>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > pageSize && (
        <div className="flex items-center justify-between gap-3 pt-2.5 text-xs text-muted">
          <span>
            {t('table.rowsOf', { first: n(first), last: n(last), total: n(rows.length) })}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="grid size-7 place-items-center rounded-md border border-border bg-bg text-text disabled:opacity-45"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label={t('table.previous')}
            >
              <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden />
            </button>
            <span className="px-1 tabular-nums">
              {t('table.page', { page: n(pageIndex + 1), count: n(pageCount) })}
            </span>
            <button
              type="button"
              className="grid size-7 place-items-center rounded-md border border-border bg-bg text-text disabled:opacity-45"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label={t('table.next')}
            >
              <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
