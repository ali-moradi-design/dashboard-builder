import { Skeleton } from '@/shared/ui'

/** Column spans (out of 12) of the placeholder cards: a KPI row, then charts. */
const CARDS = [
  'h-28 md:col-span-3',
  'h-28 md:col-span-3',
  'h-28 md:col-span-3',
  'h-28 md:col-span-3',
  'h-72 md:col-span-8',
  'h-72 md:col-span-4',
  'h-64 md:col-span-6',
  'h-64 md:col-span-6',
]

/** Placeholder shown while a dashboard document is being read from storage. */
export function DashboardGridSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      <Skeleton className="mb-4 h-8 w-64 max-w-full" />
      <div className="grid gap-4 md:grid-cols-12">
        {CARDS.map((className, i) => (
          <Skeleton key={i} className={className} />
        ))}
      </div>
    </div>
  )
}
