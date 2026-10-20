import type { TFunction } from 'i18next'

import type { QuerySpec } from '@/shared/lib/query-engine'

export interface SentencePart {
  text: string
  strong?: boolean
}

/**
 * The query as a sentence, e.g. "Show sum of Revenue by month of Order date,
 * where Country is Germany". `label` maps field names to display labels.
 */
export function describeQuery(
  q: QuerySpec,
  label: (field: string) => string,
  t: TFunction,
): SentencePart[] {
  const parts: SentencePart[] = [{ text: t('describe.show') + ' ' }]
  const list = (items: SentencePart[][]) =>
    items.forEach((item, i) => {
      if (i > 0)
        parts.push({
          text: i === items.length - 1 ? ` ${t('describe.and')} ` : t('describe.comma'),
        })
      parts.push(...item)
    })
  if (q.measures.length === 0) parts.push({ text: t('describe.rows'), strong: true })
  list(
    q.measures.map((m) => [
      {
        text:
          m.agg === 'count' && m.field === undefined
            ? t('agg.countRows')
            : t(`agg.${m.agg}`, { field: label(m.field ?? '') }),
        strong: true,
      },
    ]),
  )
  if (q.dimensions.length) {
    parts.push({ text: ` ${t('describe.by')} ` })
    list(
      q.dimensions.map((d) => [
        {
          text: d.grain
            ? t('describe.grainOf', { grain: t(`grain.${d.grain}`), field: label(d.field) })
            : label(d.field),
          strong: true,
        },
      ]),
    )
  }
  const filters = q.filters
  if (filters.length) {
    parts.push({ text: t('describe.where') + ' ' })
    list(
      filters.map((f) => [
        {
          text: t(`ops.${f.op}`, {
            field: label(f.field),
            value: Array.isArray(f.value) ? f.value.join(' – ') : String(f.value ?? '…'),
          }),
          strong: true,
        },
      ]),
    )
  }
  parts.push({ text: t('describe.end') })
  return parts
}
