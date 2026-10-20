import { useDraggable } from '@dnd-kit/core'
import { GripVertical, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { FieldTypeIcon, type DatasetField } from '@/entities/dataset'
import { cn, useFormat } from '@/shared/lib'
import { localize } from '@/shared/lib/localized'
import { Button, Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/shared/ui'

export type Zone = 'measures' | 'dimensions' | 'filters'

function FieldItem({ field, onAdd }: { field: DatasetField; onAdd: (zone: Zone) => void }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const label = localize(field.label, fmt.lang)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `field:${field.name}`,
    data: { field },
  })
  return (
    <li className={cn('flex items-center gap-1 rounded-md', isDragging && 'opacity-40')}>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        aria-label={t('qb.dragField', { field: label })}
        className="flex min-w-0 flex-1 cursor-grab items-center gap-2 rounded-md px-2 py-1.5 hover:bg-bg active:cursor-grabbing"
      >
        <FieldTypeIcon type={field.type} />
        <span className="truncate">{label}</span>
        <GripVertical className="ms-auto size-4 shrink-0 text-muted" aria-hidden />
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="iconSm" aria-label={t('qb.addField', { field: label })}>
            <Plus aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="flex w-44 flex-col gap-1 p-1.5">
          {(['measures', 'dimensions', 'filters'] as const).map((z) => (
            <PopoverClose asChild key={z}>
              <Button variant="ghost" size="sm" className="justify-start" onClick={() => onAdd(z)}>
                {t(`qb.addTo.${z}`)}
              </Button>
            </PopoverClose>
          ))}
        </PopoverContent>
      </Popover>
    </li>
  )
}

export function FieldList({
  fields,
  onAdd,
}: {
  fields: DatasetField[]
  onAdd: (field: DatasetField, zone: Zone) => void
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {fields.map((f) => (
        <FieldItem key={f.name} field={f} onAdd={(z) => onAdd(f, z)} />
      ))}
    </ul>
  )
}
