import { Popover as P } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '../lib'

export const Popover = P.Root
export const PopoverTrigger = P.Trigger
export const PopoverClose = P.Close

export function PopoverContent({
  className,
  align = 'start',
  sideOffset = 6,
  ...props
}: ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 rounded-xl border border-border bg-surface p-3 text-text shadow-xl outline-none',
          className,
        )}
        {...props}
      />
    </P.Portal>
  )
}
