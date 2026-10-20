import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Pill({
  children,
  onRemove,
  removeLabel,
}: {
  children: ReactNode
  onRemove: () => void
  removeLabel: string
}) {
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-lg border border-accent bg-accent-soft px-2 py-1 text-sm font-medium">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="grid size-5 place-items-center rounded text-muted hover:text-text"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </span>
  )
}

export const pillSelect =
  'h-7 rounded-md border border-border bg-bg px-1.5 text-xs font-normal text-text'
export const pillInput =
  'h-7 w-28 rounded-md border border-border bg-bg px-1.5 text-xs font-normal text-text'
