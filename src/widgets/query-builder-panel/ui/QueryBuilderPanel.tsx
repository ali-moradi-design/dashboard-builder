import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { ArrowLeft, Database } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useDatasets, type DatasetField } from '@/entities/dataset'
import {
  addDimension,
  addFilter,
  addMeasure,
  describeQuery,
  emptyQuery,
  runnable,
} from '@/entities/query'
import {
  defaultQuery,
  widgetDefinitions,
  WidgetTypeIcon,
  widgetTypes,
  type Widget,
  type WidgetType,
} from '@/entities/widget'
import { useFormat } from '@/shared/lib'
import { localize } from '@/shared/lib/localized'
import type { DateRange, QuerySpec } from '@/shared/lib/query-engine'
import { Button, Segmented } from '@/shared/ui'

import { FieldList, type Zone } from './FieldList'
import { Preview } from './Preview'
import { Zones } from './Zones'

export interface QueryBuilderPanelProps {
  widget: Widget
  dateRange: DateRange
  onApply: (query: QuerySpec, type: WidgetType) => void
  onClose: () => void
}

/** Full-screen query builder: drag fields into measures, group-by and filters; no SQL. */
export function QueryBuilderPanel({ widget, dateRange, onApply, onClose }: QueryBuilderPanelProps) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const datasets = useDatasets()
  const [type, setType] = useState<WidgetType>(widget.type)
  const [query, setQuery] = useState<QuerySpec>(
    () => widget.query ?? emptyQuery(datasets[0]?.id ?? 'orders'),
  )
  const [dragging, setDragging] = useState<DatasetField | null>(null)
  const dataset = datasets.find((d) => d.id === query.datasetId) ?? datasets[0]
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  if (!dataset) return null
  const label = (name: string) => {
    const f = dataset.fields.find((x) => x.name === name)
    return f ? localize(f.label, fmt.lang) : name
  }
  const add = (field: DatasetField, zone: Zone) =>
    setQuery((q) =>
      zone === 'measures'
        ? addMeasure(q, field)
        : zone === 'dimensions'
          ? addDimension(q, field)
          : addFilter(q, field),
    )
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null)
    const field = (e.active.data.current as { field?: DatasetField } | undefined)?.field
    if (field && e.over) add(field, e.over.id as Zone)
  }
  const sentence = describeQuery(query, label, t)
  const dataTypes = widgetTypes.filter((wt) => widgetDefinitions[wt].query !== null)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qb-title"
      className="fixed inset-0 z-40 flex flex-col bg-bg"
    >
      <header className="flex h-15 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('qb.back')}>
          <ArrowLeft className="rtl:-scale-x-100" aria-hidden />
        </Button>
        <h2 id="qb-title" className="truncate font-semibold">
          {t('qb.title')} · <bdi className="text-muted">{widget.title}</bdi>
        </h2>
        <div className="flex-1" />
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="primary" onClick={() => onApply(runnable(query), type)}>
          {t('qb.apply')}
        </Button>
      </header>
      <DndContext
        sensors={sensors}
        onDragStart={(e) =>
          setDragging(
            (e.active.data.current as { field?: DatasetField } | undefined)?.field ?? null,
          )
        }
        onDragCancel={() => setDragging(null)}
        onDragEnd={onDragEnd}
      >
        <div className="grid min-h-0 flex-1 md:grid-cols-[260px_1fr]">
          <aside className="flex min-h-0 flex-col gap-3 overflow-auto border-border bg-surface p-4 md:border-e">
            <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
              {t('qb.dataset')}
              <span className="relative">
                <Database
                  className="pointer-events-none absolute start-2.5 top-2.5 size-4 text-muted"
                  aria-hidden
                />
                <select
                  className="h-9 w-full rounded-lg border border-border bg-bg ps-8 pe-2 text-sm font-normal text-text"
                  value={dataset.id}
                  onChange={(e) => {
                    const next = datasets.find((d) => d.id === e.target.value)
                    if (next) setQuery(defaultQuery(type, next) ?? emptyQuery(next.id))
                  }}
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {localize(d.label, fmt.lang)}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <h3 className="text-xs font-semibold text-muted">{t('datasets.fields')}</h3>
            <FieldList fields={dataset.fields} onAdd={add} />
            <Button
              size="sm"
              variant="ghost"
              className="justify-start"
              onClick={() => setQuery((q) => addMeasure(q, null))}
            >
              + {t('qb.countRows')}
            </Button>
          </aside>
          <main className="flex min-h-0 flex-col gap-4 overflow-auto p-4 sm:p-5">
            <p
              className="rounded-card border border-border bg-surface px-4 py-3 text-base"
              aria-live="polite"
              data-testid="qb-sentence"
            >
              {sentence.map((p, i) =>
                p.strong ? (
                  <b key={i} className="font-semibold text-accent">
                    {p.text}
                  </b>
                ) : (
                  <span key={i}>{p.text}</span>
                ),
              )}
            </p>
            <Zones query={query} dataset={dataset} onChange={setQuery} />
            <section
              aria-label={t('qb.preview')}
              className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{t('qb.preview')}</h3>
                <div className="flex items-center gap-2 text-xs text-muted">
                  {t('qb.showAs')}
                  <Segmented<WidgetType>
                    label={t('qb.showAs')}
                    value={type}
                    onChange={setType}
                    options={dataTypes.map((wt) => ({
                      value: wt,
                      label: <WidgetTypeIcon type={wt} />,
                      title: t(`widgetTypes.${wt}`),
                    }))}
                  />
                </div>
              </div>
              <Preview
                widget={{ ...widget, type }}
                query={runnable(query)}
                dataset={dataset}
                dateRange={dateRange}
              />
            </section>
          </main>
        </div>
        <DragOverlay dropAnimation={null}>
          {dragging && (
            <span className="inline-flex items-center gap-2 rounded-md border border-accent bg-surface px-2.5 py-1.5 text-sm shadow-lg">
              {localize(dragging.label, fmt.lang)}
            </span>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
