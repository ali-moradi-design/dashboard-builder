import type { FieldType } from '@/shared/lib/query-engine'

const letters: Record<FieldType, string> = { number: '#', string: 'A', date: 'D', boolean: '?' }

/** Small badge for a field's type (used in field lists). */
export function FieldTypeIcon({ type }: { type: FieldType }) {
  return (
    <span
      aria-hidden
      className="grid h-5 w-5.5 shrink-0 place-items-center rounded bg-surface-2 font-[Inter_Variable,sans-serif] text-[10px] font-bold text-muted"
    >
      {letters[type]}
    </span>
  )
}
