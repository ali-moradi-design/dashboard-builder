import { ToggleGroup } from 'radix-ui'
import type { ReactNode } from 'react'

import { cn } from '../lib'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  /** Accessible name when the label is an icon. */
  title?: string
}

export interface SegmentedProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: readonly SegmentedOption<T>[]
  label: string
  className?: string
}

/** Single-choice toggle group (language, theme, chart type…). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: SegmentedProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as T)
      }}
      aria-label={label}
      className={cn('inline-flex overflow-hidden rounded-lg border border-border', className)}
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          title={o.title}
          aria-label={typeof o.label === 'string' ? undefined : o.title}
          className="inline-flex h-8 min-w-8 items-center justify-center px-2.5 text-xs font-medium text-muted data-[state=on]:bg-accent-soft data-[state=on]:text-text [&_svg]:size-4"
        >
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
