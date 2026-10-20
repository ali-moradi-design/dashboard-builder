import { useDroppable } from '@dnd-kit/core'
import { Filter, Layers, Sigma, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { findField, type Dataset } from '@/entities/dataset'
import { removeAt, removeColumn, updateAt } from '@/entities/query'
import { cn, useFormat } from '@/shared/lib'
import { localize } from '@/shared/lib/localized'
import {
  aggregations,
  dateGrains,
  type Aggregation,
  type DateGrain,
  type Filter as QFilter,
  type FilterOp,
  type QuerySpec,
} from '@/shared/lib/query-engine'

import type { Zone } from './FieldList'
import { Pill, pillInput, pillSelect } from './Pill'

function DropZone({
  zone,
  icon: Icon,
  title,
  children,
  hint,
}: {
  zone: Zone
  icon: LucideIcon
  title: string
  children: ReactNode
  hint: string
}) {
  const { isOver, setNodeRef, active } = useDroppable({ id: zone })
  return (
    <section
      ref={setNodeRef}
      aria-label={title}
      className={cn(
        'rounded-card border border-border bg-surface p-3 transition-colors',
        active && 'border-dashed',
        isOver && 'border-accent bg-accent-soft',
      )}
    >
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted">
        <Icon className="size-4" aria-hidden />
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {children}
        <span className="inline-flex h-8 items-center rounded-lg border border-dashed border-border px-2.5 text-xs text-muted">
          {hint}
        </span>
      </div>
    </section>
  )
}

const opsByType: Record<string, FilterOp[]> = {
  string: ['eq', 'neq', 'contains', 'isNull', 'notNull'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between'],
  date: ['between', 'gte', 'lte', 'eq'],
  boolean: ['eq'],
}

function FilterValue({
  filter,
  type,
  onChange,
}: {
  filter: QFilter
  type: string
  onChange: (v: QFilter['value']) => void
}) {
  const { t } = useTranslation()
  if (filter.op === 'isNull' || filter.op === 'notNull') return null
  if (type === 'boolean') {
    return (
      <select
        className={pillSelect}
        value={String(filter.value ?? true)}
        onChange={(e) => onChange(e.target.value === 'true')}
        aria-label={t('qb.value')}
      >
        <option value="true">✓</option>
        <option value="false">✗</option>
      </select>
    )
  }
  const inputType = type === 'date' ? 'date' : type === 'number' ? 'number' : 'text'
  const parse = (v: string) => (type === 'number' ? (v === '' ? undefined : Number(v)) : v)
  if (filter.op === 'between') {
    const [a, b] = Array.isArray(filter.value) ? filter.value : ['', '']
    return (
      <>
        <input
          type={inputType}
          className={pillInput}
          value={String(a ?? '')}
          aria-label={t('qb.from')}
          onChange={(e) => onChange([parse(e.target.value) ?? '', b ?? ''] as QFilter['value'])}
        />
        <span className="text-xs text-muted">–</span>
        <input
          type={inputType}
          className={pillInput}
          value={String(b ?? '')}
          aria-label={t('qb.to')}
          onChange={(e) => onChange([a ?? '', parse(e.target.value) ?? ''] as QFilter['value'])}
        />
      </>
    )
  }
  return (
    <input
      type={inputType}
      dir="auto"
      className={pillInput}
      value={Array.isArray(filter.value) ? '' : String(filter.value ?? '')}
      aria-label={t('qb.value')}
      onChange={(e) => onChange(parse(e.target.value))}
    />
  )
}

export function Zones({
  query,
  dataset,
  onChange,
}: {
  query: QuerySpec
  dataset: Dataset
  onChange: (q: QuerySpec) => void
}) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const label = (name: string | undefined) => {
    const f = findField(dataset, name)
    return f ? localize(f.label, fmt.lang) : (name ?? '')
  }
  const remove = t('qb.remove')
  const columns = [...query.dimensions, ...query.measures]
  const sort = query.sort[0]

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <DropZone zone="measures" icon={Sigma} title={t('qb.measures')} hint={t('qb.dropMeasure')}>
        {query.measures.map((m, i) => (
          <Pill
            key={m.id}
            onRemove={() => onChange(removeColumn(query, m.id))}
            removeLabel={remove}
          >
            <select
              className={pillSelect}
              aria-label={t('qb.aggregation')}
              value={m.agg}
              onChange={(e) => {
                const agg = e.target.value as Aggregation
                onChange({ ...query, measures: updateAt(query.measures, i, { agg }) })
              }}
            >
              {aggregations
                .filter((a) => a === 'count' || findField(dataset, m.field)?.type === 'number')
                .map((a) => (
                  <option key={a} value={a}>
                    {t(`qb.agg.${a}`)}
                  </option>
                ))}
            </select>
            <span>{m.field ? label(m.field) : t('qb.rows')}</span>
          </Pill>
        ))}
      </DropZone>
      <DropZone zone="dimensions" icon={Layers} title={t('qb.groupBy')} hint={t('qb.dropGroup')}>
        {query.dimensions.map((d, i) => (
          <Pill
            key={d.id}
            onRemove={() => onChange(removeColumn(query, d.id))}
            removeLabel={remove}
          >
            <span>{label(d.field)}</span>
            {findField(dataset, d.field)?.type === 'date' && (
              <select
                className={pillSelect}
                aria-label={t('qb.grain')}
                value={d.grain ?? 'day'}
                onChange={(e) =>
                  onChange({
                    ...query,
                    dimensions: updateAt(query.dimensions, i, {
                      grain: e.target.value as DateGrain,
                    }),
                  })
                }
              >
                {dateGrains.map((g) => (
                  <option key={g} value={g}>
                    {t(`qb.grains.${g}`)}
                  </option>
                ))}
              </select>
            )}
          </Pill>
        ))}
      </DropZone>
      <DropZone zone="filters" icon={Filter} title={t('qb.filters')} hint={t('qb.dropFilter')}>
        {query.filters.map((f, i) => {
          const type = findField(dataset, f.field)?.type ?? 'string'
          return (
            <Pill
              key={i}
              onRemove={() => onChange({ ...query, filters: removeAt(query.filters, i) })}
              removeLabel={remove}
            >
              <span>{label(f.field)}</span>
              <select
                className={pillSelect}
                aria-label={t('qb.operator')}
                value={f.op}
                onChange={(e) => {
                  const op = e.target.value as FilterOp
                  const value =
                    op === 'between' ? ['', ''] : Array.isArray(f.value) ? undefined : f.value
                  onChange({
                    ...query,
                    filters: updateAt(query.filters, i, { op, value: value }),
                  })
                }}
              >
                {(opsByType[type] ?? []).map((op) => (
                  <option key={op} value={op}>
                    {t(`qb.op.${op}`)}
                  </option>
                ))}
              </select>
              <FilterValue
                filter={f}
                type={type}
                onChange={(value) =>
                  onChange({ ...query, filters: updateAt(query.filters, i, { value }) })
                }
              />
            </Pill>
          )
        })}
      </DropZone>
      <section
        aria-label={t('qb.sortLimit')}
        className="rounded-card border border-border bg-surface p-3"
      >
        <h3 className="mb-2 text-xs font-semibold text-muted">{t('qb.sortLimit')}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className={cn(pillSelect, 'h-8 text-sm')}
            aria-label={t('qb.sortBy')}
            value={sort?.by ?? ''}
            onChange={(e) =>
              onChange({
                ...query,
                sort: e.target.value ? [{ by: e.target.value, dir: sort?.dir ?? 'desc' }] : [],
              })
            }
          >
            <option value="">{t('qb.autoSort')}</option>
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {'agg' in c
                  ? `${t(`qb.agg.${c.agg}`)} ${c.field ? label(c.field) : t('qb.rows')}`
                  : label(c.field)}
              </option>
            ))}
          </select>
          {sort && (
            <select
              className={cn(pillSelect, 'h-8 text-sm')}
              aria-label={t('qb.direction')}
              value={sort.dir}
              onChange={(e) =>
                onChange({
                  ...query,
                  sort: [{ by: sort.by, dir: e.target.value as 'asc' | 'desc' }],
                })
              }
            >
              <option value="desc">{t('qb.desc')}</option>
              <option value="asc">{t('qb.asc')}</option>
            </select>
          )}
          <label className="flex items-center gap-1.5 text-xs text-muted">
            {t('qb.limit')}
            <input
              type="number"
              min={1}
              max={10000}
              className={cn(pillInput, 'h-8 w-24 text-sm')}
              value={query.limit}
              onChange={(e) =>
                onChange({
                  ...query,
                  limit: Math.min(10000, Math.max(1, Math.round(Number(e.target.value) || 1))),
                })
              }
            />
          </label>
        </div>
      </section>
    </div>
  )
}
