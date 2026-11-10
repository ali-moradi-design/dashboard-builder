import { LoaderCircle, type LucideProps } from 'lucide-react'

import { cn } from '../lib'

/** Small spinning icon for buttons and inline "working" states. */
export function Spinner({ className, ...props }: LucideProps) {
  return (
    <LoaderCircle
      aria-hidden
      className={cn('animate-spin motion-reduce:animate-none', className)}
      {...props}
    />
  )
}
