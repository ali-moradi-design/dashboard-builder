import type { ComponentProps } from 'react'

import { cn } from '../lib'

/** Pulsing placeholder for content that is still loading. Decorative: mark the region busy instead. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-pulse rounded-lg bg-surface-2/60 motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  )
}
