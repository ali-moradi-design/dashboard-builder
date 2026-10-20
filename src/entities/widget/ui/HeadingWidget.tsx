import { cn } from '@/shared/lib'

import type { RendererProps } from './types'

export function HeadingWidget({ widget, settings: s }: RendererProps<'heading'>) {
  return (
    <div
      className={cn(
        'flex h-full flex-col justify-end border-b border-border pb-1.5',
        s.align === 'center' && 'items-center text-center',
      )}
    >
      <h2 dir="auto" className="text-lg leading-tight font-bold">
        {widget.title}
      </h2>
      {s.subtitle && (
        <p dir="auto" className="text-[13px] text-muted">
          {s.subtitle}
        </p>
      )}
    </div>
  )
}
