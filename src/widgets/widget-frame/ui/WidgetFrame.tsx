import { AlertCircle } from 'lucide-react'
import { memo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { useDataset, useDatasetsReady } from '@/entities/dataset'
import { useQueryResult } from '@/entities/query'
import {
  checkQuery,
  parseSettings,
  widgetDefinitions,
  widgetRenderers,
  type Widget,
} from '@/entities/widget'
import { cn } from '@/shared/lib'
import type { DateRange } from '@/shared/lib/query-engine'
import { Skeleton } from '@/shared/ui'

export interface WidgetFrameProps {
  widget: Widget
  dateRange: DateRange
  /** Extra controls in the title row (edit mode). */
  actions?: ReactNode
  selected?: boolean
  className?: string
}

function Message({ children, tone }: { children: ReactNode; tone?: 'muted' | 'danger' }) {
  return (
    <div
      className={cn(
        'grid h-full place-items-center p-2 text-center text-xs',
        tone === 'danger' ? 'text-danger' : 'text-muted',
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        {tone === 'danger' && <AlertCircle className="size-4" aria-hidden />}
        {children}
      </span>
    </div>
  )
}

function Loading() {
  const { t } = useTranslation()
  return (
    <div className="h-full" role="status" aria-busy="true" aria-label={t('common.loading')}>
      <Skeleton className="h-full" />
    </div>
  )
}

/**
 * Memoized: a widget is re-rendered only when its own document, the date
 * filter or its query result changes, not on every edit elsewhere on the page.
 */
const WidgetBody = memo(function WidgetBody({
  widget,
  dateRange,
}: {
  widget: Widget
  dateRange: DateRange
}) {
  const { t } = useTranslation()
  const dataset = useDataset(widget.query?.datasetId)
  const datasetsReady = useDatasetsReady()
  const issue = checkQuery(widget.type, widget.query)
  const needsData = widgetDefinitions[widget.type].query !== null
  const result = useQueryResult(needsData && !issue ? widget.query : undefined, dataset, dateRange)
  const settings = parseSettings(widget.type, widget.settings)
  const Renderer = widgetRenderers[widget.type]

  if (!needsData)
    return (
      <Renderer widget={widget} settings={settings} rows={[]} columns={[]} dataset={undefined} />
    )
  if (issue) return <Message>{t('widget.notSetUp')}</Message>
  // Imported datasets are read from IndexedDB at startup: not "missing" until that finished.
  if (!dataset && !datasetsReady) return <Loading />
  if (!dataset) return <Message tone="danger">{t('widget.datasetMissing')}</Message>
  if (result.compileError || result.error)
    return <Message tone="danger">{t('widget.failed')}</Message>
  if (!result.rows || !result.compiled) return <Loading />
  if (result.rows.length === 0) return <Message>{t('widget.noData')}</Message>
  return (
    <div className={cn('h-full min-h-0 transition-opacity', result.isFetching && 'opacity-60')}>
      <Renderer
        widget={widget}
        settings={settings}
        rows={result.rows}
        columns={result.compiled.columns}
        dataset={dataset}
      />
    </div>
  )
})

/** Card around one widget: title, state handling (loading, empty, error) and the renderer. */
export const WidgetFrame = memo(function WidgetFrame({
  widget,
  dateRange,
  actions,
  selected,
  className,
}: WidgetFrameProps) {
  if (widget.type === 'heading') {
    return (
      <section
        aria-label={widget.title}
        className={cn('relative h-full', className)}
        data-widget={widget.id}
      >
        {actions && <div className="absolute end-1 top-1 z-10">{actions}</div>}
        <WidgetBody widget={widget} dateRange={dateRange} />
      </section>
    )
  }
  return (
    <section
      aria-label={widget.title}
      data-widget={widget.id}
      className={cn(
        'relative flex h-full min-h-0 flex-col rounded-card border border-border bg-surface px-4 py-3',
        selected && 'border-accent ring-4 ring-accent-soft',
        className,
      )}
    >
      {(widget.title || actions) && (
        <header className="mb-1.5 flex min-h-6 items-center gap-2">
          <h3 className="min-w-0 flex-1 truncate text-start text-[13px] font-semibold text-muted [unicode-bidi:plaintext]">
            {widget.title}
          </h3>
          {actions}
        </header>
      )}
      <div className="min-h-0 flex-1">
        <WidgetBody widget={widget} dateRange={dateRange} />
      </div>
    </section>
  )
})
