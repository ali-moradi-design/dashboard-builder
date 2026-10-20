import { Calendar, ChevronDown, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useDateExtent, type Dataset } from '@/entities/dataset'
import { cn, formatDate, useFormat } from '@/shared/lib'
import type { DateRange } from '@/shared/lib/query-engine'
import { Button, Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/shared/ui'

export interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  /** Dataset whose date span suggests the year presets. */
  dataset: Dataset | undefined
}

const toDate = (iso: string) => new Date(iso + 'T00:00:00Z')

/** The dashboard's one global date-range filter. */
export function DateRangeFilter({ value, onChange, dataset }: DateRangeFilterProps) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const extent = useDateExtent(dataset)
  const [from, setFrom] = useState(value.from ?? '')
  const [to, setTo] = useState(value.to ?? '')
  const active = Boolean(value.from || value.to)
  const years: number[] = []
  if (extent.data) {
    for (let y = Number(extent.data.to.slice(0, 4)); y >= Number(extent.data.from.slice(0, 4)); y--)
      years.push(y)
  }
  const label = active
    ? `${value.from ? formatDate(toDate(value.from), fmt) : '…'} – ${value.to ? formatDate(toDate(value.to), fmt) : '…'}`
    : t('dateFilter.allTime')
  const isYear = (y: number) => value.from === `${y}-01-01` && value.to === `${y}-12-31`

  return (
    <div className="flex items-center gap-1">
      <Popover
        onOpenChange={(open) => {
          if (open) {
            setFrom(value.from ?? '')
            setTo(value.to ?? '')
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button className="bg-surface">
            <Calendar aria-hidden />
            <span className="text-xs font-normal text-muted">{t('dateFilter.label')}</span>
            <span>{label}</span>
            <ChevronDown aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              <PopoverClose asChild>
                <Button
                  size="sm"
                  variant={active ? 'secondary' : 'primary'}
                  onClick={() => onChange({})}
                >
                  {t('dateFilter.allTime')}
                </Button>
              </PopoverClose>
              {years.map((y) => (
                <PopoverClose asChild key={y}>
                  <Button
                    size="sm"
                    variant={isYear(y) ? 'primary' : 'secondary'}
                    onClick={() => onChange({ from: `${y}-01-01`, to: `${y}-12-31` })}
                  >
                    {formatDate(toDate(`${y}-06-01`), fmt, 'year')}
                  </Button>
                </PopoverClose>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs text-muted">
                {t('dateFilter.from')}
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-9 rounded-lg border border-border bg-bg px-2 text-sm text-text"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                {t('dateFilter.to')}
                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-9 rounded-lg border border-border bg-bg px-2 text-sm text-text"
                />
              </label>
            </div>
            <PopoverClose asChild>
              <Button
                variant="primary"
                onClick={() => onChange({ from: from || undefined, to: to || undefined })}
              >
                {t('dateFilter.apply')}
              </Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
      {active && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('dateFilter.clear')}
          onClick={() => onChange({})}
          className={cn('text-muted')}
        >
          <X aria-hidden />
        </Button>
      )}
    </div>
  )
}
