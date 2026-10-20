import { useTranslation } from 'react-i18next'

import {
  findField,
  formatDimensionValue,
  formatMeasureValue,
  type Dataset,
} from '@/entities/dataset'
import { useQueryResult } from '@/entities/query'
import {
  checkQuery,
  columnLabel,
  parseSettings,
  widgetRenderers,
  type Widget,
} from '@/entities/widget'
import { formatNumber, useFormat } from '@/shared/lib'
import type { DateRange, QuerySpec } from '@/shared/lib/query-engine'
import { DataTable } from '@/shared/ui'

/** Live result of the draft query: the widget's chart and the raw rows. */
export function Preview({
  widget,
  query,
  dataset,
  dateRange,
}: {
  widget: Widget
  query: QuerySpec
  dataset: Dataset
  dateRange: DateRange
}) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const issue = checkQuery(widget.type, query)
  const canRun = query.measures.length + query.dimensions.length > 0
  const result = useQueryResult(canRun ? query : undefined, dataset, dateRange)
  const Renderer = widgetRenderers[widget.type]
  const rows = result.rows ?? []
  const columns = result.compiled?.columns ?? []

  return (
    <div className="grid min-h-0 gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex min-h-72 flex-col">
        <div className="mb-1 flex items-center justify-between text-xs text-muted">
          <span aria-live="polite">
            {result.isFetching
              ? t('common.loading')
              : result.rows
                ? t('datasets.rows', { n: formatNumber(rows.length, fmt, { decimals: 0 }) })
                : ''}
          </span>
        </div>
        <div className="h-72 min-h-0">
          {!canRun ? (
            <p className="grid h-full place-items-center text-sm text-muted">{t('qb.emptyHint')}</p>
          ) : issue ? (
            <p className="grid h-full place-items-center text-center text-sm text-muted">
              {t(`qb.issues.${issue}`, { type: t(`widgetTypes.${widget.type}`) })}
            </p>
          ) : result.compileError || result.error ? (
            <p role="alert" className="grid h-full place-items-center text-sm text-danger">
              {t('widget.failed')}
            </p>
          ) : result.compiled && result.rows ? (
            <Renderer
              widget={{ ...widget, query }}
              settings={parseSettings(widget.type, widget.settings)}
              rows={rows}
              columns={columns}
              dataset={dataset}
            />
          ) : (
            <div className="h-full animate-pulse rounded-lg bg-surface-2/60" />
          )}
        </div>
      </div>
      <div className="min-h-72">
        {result.compiled && result.rows && (
          <DataTable
            label={t('qb.preview')}
            rows={rows}
            pageSize={8}
            columns={columns.map((c) => ({
              key: c.alias,
              header: columnLabel(c, dataset, fmt.lang, t),
              align: c.kind === 'measure' ? 'end' : 'start',
              format: (v) =>
                c.kind === 'measure'
                  ? formatMeasureValue(v, findField(dataset, c.field), fmt, undefined, c.agg)
                  : formatDimensionValue(v, findField(dataset, c.field), fmt, c.grain),
            }))}
          />
        )}
      </div>
    </div>
  )
}
